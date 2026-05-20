use dirs::config_dir;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::ErrorKind;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    pub appearance: Appearance,
    pub behavior: Behavior,
    pub terminal: Terminal,
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Appearance {
    pub theme: String,
    pub icon_set: String,
    pub font_size: u8,
    pub show_hidden_files: bool,
    #[serde(default = "default_accent")]
    pub accent: String,
    #[serde(default = "default_window_controls")]
    pub window_controls: bool,
    #[serde(default = "default_icon_size")]
    pub icon_size: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Behavior {
    pub default_path: String,
    pub confirm_delete: bool,
    pub single_click_open: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Terminal {
    pub emulator: String,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            appearance: Appearance {
                theme: "dark".to_string(),
                icon_set: "Papirus".to_string(),
                font_size: 14,
                show_hidden_files: false,
                accent: "orange".to_string(),
                window_controls: true,
                icon_size: "medium".to_string(),
            },
            behavior: Behavior {
                default_path: "/drives".to_string(),
                confirm_delete: true,
                single_click_open: false,
            },
            terminal: Terminal {
                emulator: "kitty".to_string(),
            },
        }
    }
}

fn config_file_path() -> PathBuf {
    let mut path = config_dir().unwrap_or_else(|| {
        let fallback = std::env::var("HOME").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from("."));
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
        fs::create_dir_all(parent).map_err(|err| format!("Failed to create config directory: {err}"))?;
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
