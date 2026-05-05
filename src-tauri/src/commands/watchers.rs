use crate::services::watcher_service;
use notify::DebouncedEvent;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn watch_directory(path: String, app: AppHandle) -> Result<(), String> {
    watcher_service::watch_directory(path, move |result| {
        if let Ok(event) = result {
            match event {
                DebouncedEvent::Create(changed_path)
                | DebouncedEvent::Write(changed_path)
                | DebouncedEvent::Remove(changed_path)
                | DebouncedEvent::Chmod(changed_path)
                | DebouncedEvent::NoticeWrite(changed_path)
                | DebouncedEvent::NoticeRemove(changed_path) => {
                    let payload = serde_json::json!({
                        "path": changed_path.to_string_lossy(),
                        "event": format!("{:?}", event),
                    });

                    let _ = app.emit("filesystem://changed", payload);
                }
                DebouncedEvent::Rename(from, to) => {
                    let payload = serde_json::json!({
                        "path": to.to_string_lossy(),
                        "oldPath": from.to_string_lossy(),
                        "event": "Rename",
                    });

                    let _ = app.emit("filesystem://changed", payload);
                }
                _ => {}
            }
        }
    })
    .map_err(|error| error.to_string())?;

    Ok(())
}
