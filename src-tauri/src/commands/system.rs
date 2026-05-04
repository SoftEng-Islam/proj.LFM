use font_loader::system_fonts;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
#[tauri::command]
#[inline]
pub async fn check_vscode_installed() -> Result<bool, String> {
    let output = Command::new("cmd")
        .args(["/C", "code -v"])
        .creation_flags(0x08000000)
        .output()
        .expect("failed to execute process");

    Ok(output.status.success())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
#[inline]
pub async fn check_vscode_installed() -> Result<bool, String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg("code -v")
        .output()
        .expect("failed to execute process");

    Ok(output.status.success())
}

#[tauri::command]
#[inline]
pub fn get_available_fonts() -> Result<Vec<String>, String> {
    Ok(system_fonts::query_all())
}
