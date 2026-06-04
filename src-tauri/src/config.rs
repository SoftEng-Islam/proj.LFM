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
    pub shortcuts: Shortcuts,
}

fn default_accent() -> String {
    "orange".to_string()
}

fn default_window_controls() -> bool {
    true
}

fn default_show_minimize() -> bool {
    true
}

fn default_show_maximize() -> bool {
    true
}

fn default_show_close() -> bool {
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
    #[serde(default = "default_show_minimize")]
    pub show_minimize: bool,
    #[serde(default = "default_show_maximize")]
    pub show_maximize: bool,
    #[serde(default = "default_show_close")]
    pub show_close: bool,
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Shortcuts {
    pub back: Vec<String>,
    pub forward: Vec<String>,
    pub refresh: Vec<String>,
    pub focus_search: Vec<String>,
    pub help: Vec<String>,
    pub rename: Vec<String>,
    pub toggle_preview: Vec<String>,
    pub toggle_ai: Vec<String>,
    pub goto_default_path: Vec<String>,
    pub open_settings: Vec<String>,
    pub next_tab: Vec<String>,
    pub previous_tab: Vec<String>,
    pub increase_icon_size: Vec<String>,
    pub decrease_icon_size: Vec<String>,
    pub select_all: Vec<String>,
    pub copy: Vec<String>,
    pub cut: Vec<String>,
    pub paste: Vec<String>,
    pub open_selected: Vec<String>,
    pub delete_selected: Vec<String>,
    pub clear_or_close: Vec<String>,
    pub toggle_selection: Vec<String>,
    pub toggle_selection_focused: Vec<String>,
    pub move_up: Vec<String>,
    pub move_down: Vec<String>,
    pub move_left: Vec<String>,
    pub move_right: Vec<String>,
    pub extend_up: Vec<String>,
    pub extend_down: Vec<String>,
    pub extend_left: Vec<String>,
    pub extend_right: Vec<String>,
}

#[derive(Deserialize, Debug, Clone, Default)]
struct ConfigFile {
    #[serde(default)]
    appearance: Appearance,
    #[serde(default)]
    behavior: Behavior,
    #[serde(default)]
    terminal: Terminal,
    #[serde(default)]
    explorer: Explorer,
    shortcuts: Option<ShortcutsFile>,
}

#[derive(Deserialize, Debug, Clone, Default)]
struct ShortcutsFile {
    back: Option<Vec<String>>,
    forward: Option<Vec<String>>,
    refresh: Option<Vec<String>>,
    focus_search: Option<Vec<String>>,
    help: Option<Vec<String>>,
    rename: Option<Vec<String>>,
    toggle_preview: Option<Vec<String>>,
    toggle_ai: Option<Vec<String>>,
    goto_default_path: Option<Vec<String>>,
    open_settings: Option<Vec<String>>,
    next_tab: Option<Vec<String>>,
    previous_tab: Option<Vec<String>>,
    increase_icon_size: Option<Vec<String>>,
    decrease_icon_size: Option<Vec<String>>,
    select_all: Option<Vec<String>>,
    copy: Option<Vec<String>>,
    cut: Option<Vec<String>>,
    paste: Option<Vec<String>>,
    open_selected: Option<Vec<String>>,
    delete_selected: Option<Vec<String>>,
    clear_or_close: Option<Vec<String>>,
    toggle_selection: Option<Vec<String>>,
    toggle_selection_focused: Option<Vec<String>>,
    move_up: Option<Vec<String>>,
    move_down: Option<Vec<String>>,
    move_left: Option<Vec<String>>,
    move_right: Option<Vec<String>>,
    extend_up: Option<Vec<String>>,
    extend_down: Option<Vec<String>>,
    extend_left: Option<Vec<String>>,
    extend_right: Option<Vec<String>>,
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
            shortcuts: Shortcuts::default(),
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
            show_minimize: default_show_minimize(),
            show_maximize: default_show_maximize(),
            show_close: default_show_close(),
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

impl Default for Shortcuts {
    fn default() -> Self {
        Shortcuts {
            back: vec!["Alt+ArrowLeft".to_string()],
            forward: vec!["Alt+ArrowRight".to_string()],
            refresh: vec!["F5".to_string()],
            focus_search: vec!["Ctrl+f".to_string(), "Meta+f".to_string()],
            help: vec!["F1".to_string()],
            rename: vec!["F2".to_string()],
            toggle_preview: vec!["F3".to_string()],
            toggle_ai: vec!["F4".to_string()],
            goto_default_path: vec!["F6".to_string()],
            open_settings: vec!["F7".to_string()],
            next_tab: vec![
                "Ctrl+PageDown".to_string(),
                "Ctrl+Shift+ArrowRight".to_string(),
            ],
            previous_tab: vec![
                "Ctrl+PageUp".to_string(),
                "Ctrl+Shift+ArrowLeft".to_string(),
            ],
            increase_icon_size: vec!["Ctrl+=".to_string()],
            decrease_icon_size: vec!["Ctrl+-".to_string()],
            select_all: vec!["Ctrl+a".to_string(), "Meta+a".to_string()],
            copy: vec!["Ctrl+c".to_string(), "Meta+c".to_string()],
            cut: vec!["Ctrl+x".to_string(), "Meta+x".to_string()],
            paste: vec!["Ctrl+v".to_string(), "Meta+v".to_string()],
            open_selected: vec!["Enter".to_string()],
            delete_selected: vec!["Delete".to_string()],
            clear_or_close: vec!["Escape".to_string()],
            toggle_selection: vec!["Space".to_string()],
            toggle_selection_focused: vec!["Ctrl+Space".to_string(), "Meta+Space".to_string()],
            move_up: vec!["ArrowUp".to_string()],
            move_down: vec!["ArrowDown".to_string()],
            move_left: vec!["ArrowLeft".to_string()],
            move_right: vec!["ArrowRight".to_string()],
            extend_up: vec!["Shift+ArrowUp".to_string()],
            extend_down: vec!["Shift+ArrowDown".to_string()],
            extend_left: vec!["Shift+ArrowLeft".to_string()],
            extend_right: vec!["Shift+ArrowRight".to_string()],
        }
    }
}

fn parse_config(content: &str) -> Result<Config, toml::de::Error> {
    let file = toml::from_str::<ConfigFile>(content)?;
    let default_shortcuts = Shortcuts::default();
    let raw_shortcuts = file.shortcuts.unwrap_or_default();

    Ok(Config {
        appearance: file.appearance,
        behavior: file.behavior,
        terminal: file.terminal,
        explorer: file.explorer,
        shortcuts: Shortcuts {
            back: raw_shortcuts.back.unwrap_or(default_shortcuts.back),
            forward: raw_shortcuts.forward.unwrap_or(default_shortcuts.forward),
            refresh: raw_shortcuts.refresh.unwrap_or(default_shortcuts.refresh),
            focus_search: raw_shortcuts
                .focus_search
                .unwrap_or(default_shortcuts.focus_search),
            help: raw_shortcuts.help.unwrap_or(default_shortcuts.help),
            rename: raw_shortcuts.rename.unwrap_or(default_shortcuts.rename),
            toggle_preview: raw_shortcuts
                .toggle_preview
                .unwrap_or(default_shortcuts.toggle_preview),
            toggle_ai: raw_shortcuts
                .toggle_ai
                .unwrap_or(default_shortcuts.toggle_ai),
            goto_default_path: raw_shortcuts
                .goto_default_path
                .unwrap_or(default_shortcuts.goto_default_path),
            open_settings: raw_shortcuts
                .open_settings
                .unwrap_or(default_shortcuts.open_settings),
            next_tab: raw_shortcuts.next_tab.unwrap_or(default_shortcuts.next_tab),
            previous_tab: raw_shortcuts
                .previous_tab
                .unwrap_or(default_shortcuts.previous_tab),
            increase_icon_size: raw_shortcuts
                .increase_icon_size
                .unwrap_or(default_shortcuts.increase_icon_size),
            decrease_icon_size: raw_shortcuts
                .decrease_icon_size
                .unwrap_or(default_shortcuts.decrease_icon_size),
            select_all: raw_shortcuts
                .select_all
                .unwrap_or(default_shortcuts.select_all),
            copy: raw_shortcuts.copy.unwrap_or(default_shortcuts.copy),
            cut: raw_shortcuts.cut.unwrap_or(default_shortcuts.cut),
            paste: raw_shortcuts.paste.unwrap_or(default_shortcuts.paste),
            open_selected: raw_shortcuts
                .open_selected
                .unwrap_or(default_shortcuts.open_selected),
            delete_selected: raw_shortcuts
                .delete_selected
                .unwrap_or(default_shortcuts.delete_selected),
            clear_or_close: raw_shortcuts
                .clear_or_close
                .unwrap_or(default_shortcuts.clear_or_close),
            toggle_selection: raw_shortcuts
                .toggle_selection
                .unwrap_or(default_shortcuts.toggle_selection),
            toggle_selection_focused: raw_shortcuts
                .toggle_selection_focused
                .unwrap_or(default_shortcuts.toggle_selection_focused),
            move_up: raw_shortcuts.move_up.unwrap_or(default_shortcuts.move_up),
            move_down: raw_shortcuts
                .move_down
                .unwrap_or(default_shortcuts.move_down),
            move_left: raw_shortcuts
                .move_left
                .unwrap_or(default_shortcuts.move_left),
            move_right: raw_shortcuts
                .move_right
                .unwrap_or(default_shortcuts.move_right),
            extend_up: raw_shortcuts
                .extend_up
                .unwrap_or(default_shortcuts.extend_up),
            extend_down: raw_shortcuts
                .extend_down
                .unwrap_or(default_shortcuts.extend_down),
            extend_left: raw_shortcuts
                .extend_left
                .unwrap_or(default_shortcuts.extend_left),
            extend_right: raw_shortcuts
                .extend_right
                .unwrap_or(default_shortcuts.extend_right),
        },
    })
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

    match parse_config(&content) {
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
                        if let Ok(config) = parse_config(&content) {
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
