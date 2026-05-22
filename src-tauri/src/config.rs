use dirs::config_dir;
use notify::{raw_watcher, RawEvent, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::ErrorKind;
use std::path::PathBuf;
use std::sync::mpsc::channel;
use tauri::Emitter;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    #[serde(default)]
    pub appearance: Appearance,
    #[serde(default)]
    pub behavior: Behavior,
    #[serde(default)]
    pub terminal: Terminal,
    #[serde(default)]
    pub explorer: Explorer,
}

fn default_accent() -> String {
    "orange".to_string()
}

fn default_window_controls() -> bool {
    true
}

fn default_icon_size() -> String {
    "medium".to_string()
}

fn default_icon_set() -> String {
    "Papirus".to_string()
}

fn default_hidden_files_visual_style() -> String {
    "dimmed".to_string()
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Appearance {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_icon_set")]
    pub icon_set: String,
    #[serde(default = "default_font_size")]
    pub font_size: u8,
    #[serde(default)]
    pub show_hidden_files: bool,
    #[serde(default = "default_accent")]
    pub accent: String,
    #[serde(default = "default_window_controls")]
    pub window_controls: bool,
    #[serde(default = "default_icon_size")]
    pub icon_size: String,
    #[serde(default = "default_hidden_files_visual_style")]
    pub hidden_files_visual_style: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Behavior {
    #[serde(default = "default_path")]
    pub default_path: String,
    #[serde(default = "default_confirm_delete")]
    pub confirm_delete: bool,
    #[serde(default)]
    pub single_click_open: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Terminal {
    #[serde(default = "default_terminal_emulator")]
    pub emulator: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Explorer {
    #[serde(default)]
    pub show_mount_points: bool,
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_font_size() -> u8 {
    14
}

fn default_path() -> String {
    "/drives".to_string()
}

fn default_confirm_delete() -> bool {
    true
}

fn default_terminal_emulator() -> String {
    "kitty".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Config {
            appearance: Appearance::default(),
            behavior: Behavior::default(),
            terminal: Terminal::default(),
            explorer: Explorer::default(),
        }
    }
}

impl Default for Appearance {
    fn default() -> Self {
        Appearance {
            theme: default_theme(),
            icon_set: default_icon_set(),
            font_size: default_font_size(),
            show_hidden_files: false,
            accent: default_accent(),
            window_controls: default_window_controls(),
            icon_size: default_icon_size(),
            hidden_files_visual_style: default_hidden_files_visual_style(),
        }
    }
}

impl Default for Behavior {
    fn default() -> Self {
        Behavior {
            default_path: default_path(),
            confirm_delete: default_confirm_delete(),
            single_click_open: false,
        }
    }
}

impl Default for Terminal {
    fn default() -> Self {
        Terminal {
            emulator: default_terminal_emulator(),
        }
    }
}

impl Default for Explorer {
    fn default() -> Self {
        Explorer {
            show_mount_points: false,
        }
    }
}

fn config_file_path() -> PathBuf {
    let mut path = config_dir().unwrap_or_else(|| {
        let fallback = std::env::var("HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("."));
        fallback.join(".config")
    });
    path.push("LFM");
    path.push("config.toml");
    path
}

fn write_default_config(path: &PathBuf, default: &Config) {
    if let Some(parent) = path.parent() {
        if let Err(err) = fs::create_dir_all(parent) {
            eprintln!("Failed to create config directory: {err:?}");
            return;
        }
    }

    let serialized = match toml::to_string_pretty(default) {
        Ok(value) => value,
        Err(err) => {
            eprintln!("Failed to serialize default config: {err}");
            return;
        }
    };

    if let Err(err) = fs::write(path, serialized) {
        eprintln!("Failed to write default config: {err}");
    }
}

#[tauri::command]
pub fn get_config() -> Result<Config, String> {
    let path = config_file_path();
    if !path.exists() {
        let default = Config::default();
        write_default_config(&path, &default);
        return Ok(default);
    }

    let content = match fs::read_to_string(&path) {
        Ok(value) => value,
        Err(err) => {
            eprintln!("Failed to read config file: {err}");
            return Ok(Config::default());
        }
    };

    match toml::from_str::<Config>(&content) {
        Ok(config) => Ok(config),
        Err(err) => {
            eprintln!("Failed to parse config file: {err}");
            Ok(Config::default())
        }
    }
}

#[tauri::command]
pub fn save_config(config: Config) -> Result<bool, String> {
    let path = config_file_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|err| format!("Failed to create config directory: {err}"))?;
    }

    let serialized = toml::to_string_pretty(&config).map_err(|err| err.to_string())?;
    match fs::write(&path, serialized) {
        Ok(_) => Ok(true),
        Err(err) => {
            if err.kind() == ErrorKind::PermissionDenied {
                eprintln!("Cannot write config file: {err}");
                Err("Permission denied writing config file".to_string())
            } else {
                Err(err.to_string())
            }
        }
    }
}

/// Watch `~/.config/LFM/config.toml` for external changes.
/// When the file is modified, the new config is parsed and emitted
/// to the frontend via a `config_file_changed` event.
#[tauri::command]
pub async fn watch_config_file(window: tauri::Window) {
    let path = config_file_path();

    // Ensure the config file exists before watching
    if !path.exists() {
        let default = Config::default();
        write_default_config(&path, &default);
    }

    // Watch the parent directory (so we catch file renames/recreations too)
    let watch_path = path.parent().unwrap_or(path.as_path()).to_path_buf();

    std::thread::spawn(move || {
        let (tx, rx) = channel();
        let mut watcher = match raw_watcher(tx) {
            Ok(w) => w,
            Err(err) => {
                eprintln!("[LFM] Failed to create config watcher: {err}");
                return;
            }
        };

        if let Err(err) = watcher.watch(&watch_path, RecursiveMode::NonRecursive) {
            eprintln!("[LFM] Failed to watch config directory: {err}");
            return;
        }

        loop {
            match rx.recv() {
                Ok(RawEvent {
                    path: event_path, ..
                }) => {
                    // Only react to changes on the actual config.toml file
                    let config_path = config_file_path();
                    let is_our_file = event_path
                        .as_ref()
                        .map(|p| p == &config_path)
                        .unwrap_or(false);

                    if !is_our_file {
                        continue;
                    }

                    // Small delay for editors that write atomically (rename temp → target)
                    std::thread::sleep(std::time::Duration::from_millis(100));

                    // Try to read and parse the updated config
                    if let Ok(content) = fs::read_to_string(&config_path) {
                        if let Ok(config) = toml::from_str::<Config>(&content) {
                            if let Err(err) = window.emit("config_file_changed", &config) {
                                eprintln!("[LFM] Failed to emit config change event: {err}");
                            }
                        }
                    }
                }
                Err(err) => {
                    eprintln!("[LFM] Config watcher channel error: {err}");
                    break;
                }
            }
        }
    });
}
