use crate::services::filesystem_service;

#[tauri::command]
pub async fn read_directory_paginated(
    path: String,
    offset: usize,
    limit: usize,
) -> Result<Vec<String>, String> {
    filesystem_service::read_directory_paginated(path, offset, limit)
        .await
        .map_err(|error| error.to_string())
}
