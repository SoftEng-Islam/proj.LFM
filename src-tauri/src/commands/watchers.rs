use crate::services::watcher_service;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn watch_directory(path: String, app: AppHandle) -> Result<(), String> {
    watcher_service::watch_directory(path, move |result| {
        if let Ok(event) = result {
            for changed_path in event.paths {
                let payload = serde_json::json!({
                    "path": changed_path.to_string_lossy(),
                    "event": format!("{:?}", event.kind),
                });

                let _ = app.emit("filesystem://changed", payload);
            }
        }
    })
    .map_err(|error| error.to_string())?;

    Ok(())
}
