use crate::services::watcher_service;
use notify::DebouncedEvent;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn watch_directory(path: String, app: AppHandle) -> Result<(), String> {
    watcher_service::watch_directory(path, move |result| {
        if let Ok(event) = result {
            match event {
                DebouncedEvent::Create(changed_path) => {
                    emit_event(&app, changed_path.to_string_lossy().to_string(), "Create");
                }
                DebouncedEvent::Write(changed_path) => {
                    emit_event(&app, changed_path.to_string_lossy().to_string(), "Write");
                }
                DebouncedEvent::Remove(changed_path) => {
                    emit_event(&app, changed_path.to_string_lossy().to_string(), "Remove");
                }
                DebouncedEvent::Chmod(changed_path) => {
                    emit_event(&app, changed_path.to_string_lossy().to_string(), "Chmod");
                }
                DebouncedEvent::NoticeWrite(changed_path) => {
                    emit_event(
                        &app,
                        changed_path.to_string_lossy().to_string(),
                        "NoticeWrite",
                    );
                }
                DebouncedEvent::NoticeRemove(changed_path) => {
                    emit_event(
                        &app,
                        changed_path.to_string_lossy().to_string(),
                        "NoticeRemove",
                    );
                }
                DebouncedEvent::Rename(from, to) => {
                    let payload = serde_json::json!({
                        "path": to.to_string_lossy().to_string(),
                        "oldPath": from.to_string_lossy().to_string(),
                        "event": "Rename",
                    });

                    let _ = app.emit("filesystem://changed", payload);
                }
                DebouncedEvent::Rescan => {
                    let payload = serde_json::json!({
                        "event": "Rescan",
                    });

                    let _ = app.emit("filesystem://changed", payload);
                }
                DebouncedEvent::Error(error, path) => {
                    let payload = serde_json::json!({
                        "event": "Error",
                        "message": error.to_string(),
                        "path": path.map(|p| p.to_string_lossy().to_string()),
                    });

                    let _ = app.emit("filesystem://changed", payload);
                }
            }
        }
    })
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn emit_event(app: &AppHandle, path: String, event_name: &str) {
    let payload = serde_json::json!({
        "path": path,
        "event": event_name,
    });

    let _ = app.emit("filesystem://changed", payload);
}
