use crate::services::system_service;
use serde::Serialize;
use std::process::Command;

#[tauri::command]
#[inline]
pub async fn check_vscode_installed() -> Result<bool, String> {
    system_service::check_vscode_installed()
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[inline]
pub fn get_available_fonts() -> Result<Vec<String>, String> {
    system_service::get_available_fonts().map_err(|error| error.to_string())
}

/**
 * Return the current user's home directory path.
 * Fallback to "/root" if HOME is not set.
 */
#[tauri::command]
#[inline]
pub fn get_home_dir() -> String {
    std::env::var("HOME").unwrap_or_else(|_| "/root".to_string())
}

#[derive(Serialize)]
pub struct GitStatus {
    pub branch: String,
    pub is_repo: bool,
    pub modified_count: usize,
    pub staged_count: usize,
    pub untracked_count: usize,
}

#[tauri::command]
#[inline]
pub fn get_git_status(folder_path: String) -> Result<GitStatus, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(&folder_path)
        .arg("status")
        .arg("--porcelain")
        .arg("-b")
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Ok(GitStatus {
            branch: String::new(),
            is_repo: false,
            modified_count: 0,
            staged_count: 0,
            untracked_count: 0,
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut lines = stdout.lines();
    let branch_line = lines.next().unwrap_or_default();
    let branch = branch_line
        .strip_prefix("## ")
        .unwrap_or(branch_line)
        .split_whitespace()
        .next()
        .unwrap_or_default()
        .to_string();

    let mut modified_count = 0;
    let mut staged_count = 0;
    let mut untracked_count = 0;

    for line in lines {
        if line.starts_with("??") {
            untracked_count += 1;
            continue;
        }

        let chars: Vec<char> = line.chars().collect();
        if chars.get(0).copied().unwrap_or(' ') != ' ' {
            staged_count += 1;
        }
        if chars.get(1).copied().unwrap_or(' ') != ' ' {
            modified_count += 1;
        }
    }

    Ok(GitStatus {
        branch,
        is_repo: true,
        modified_count,
        staged_count,
        untracked_count,
    })
}

#[derive(Serialize)]
pub struct TerminalCommandResponse {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[tauri::command]
#[inline]
pub fn run_terminal_command(cwd: String, command: String) -> Result<TerminalCommandResponse, String> {
    let output = Command::new("sh")
        .arg("-lc")
        .arg(&command)
        .current_dir(&cwd)
        .output()
        .map_err(|error| error.to_string())?;

    Ok(TerminalCommandResponse {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}
