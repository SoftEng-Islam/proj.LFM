use crate::services::filesystem_service;
use crate::utils::decode_path;

#[tauri::command]
pub async fn read_directory_paginated(
    path: String,
    offset: usize,
    limit: usize,
) -> Result<Vec<String>, String> {
    let decoded_path = decode_path(&path);
    filesystem_service::read_directory_paginated(decoded_path, offset, limit)
        .await
        .map_err(|error| error.to_string())
}
