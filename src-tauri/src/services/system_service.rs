use crate::errors::AppResult;
use font_loader::system_fonts;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

pub async fn check_vscode_installed() -> AppResult<bool> {
    #[cfg(target_os = "windows")]
    let output = Command::new("cmd")
        .args(["/C", "code -v"])
        .creation_flags(0x08000000)
        .output()?;

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("sh")
        .arg("-c")
        .arg("code -v")
        .output()?;

    Ok(output.status.success())
}

pub fn get_available_fonts() -> AppResult<Vec<String>> {
    Ok(system_fonts::query_all())
}
