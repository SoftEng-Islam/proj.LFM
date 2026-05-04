use crate::services::system_service;

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
