use tokio::process::Command;
use sha2::{Sha256, Digest};
use std::fs;
use std::path::Path;
use dirs::cache_dir;

#[tauri::command]
pub async fn get_video_thumbnail(video_path: String) -> Result<String, String> {
    let path = Path::new(&video_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    // Create cache directory
    let cache_base = cache_dir()
        .ok_or_else(|| "Could not find cache directory".to_string())?
        .join("lfm")
        .join("thumbnails");
    
    if !cache_base.exists() {
        fs::create_dir_all(&cache_base).map_err(|e| e.to_string())?;
    }

    // Create a unique hash for the file path to use as filename
    let mut hasher = Sha256::new();
    hasher.update(video_path.as_bytes());
    let hash = hex::encode(hasher.finalize());
    let thumbnail_path = cache_base.join(format!("{}.jpg", hash));

    // If thumbnail already exists, return it
    if thumbnail_path.exists() {
        return Ok(thumbnail_path.to_str().unwrap().to_string());
    }

    // Run ffmpeg to extract a frame at 1 second mark
    // Use tokio::process for true async execution
    let mut cmd = Command::new("ffmpeg");
    cmd.args(&[
        "-i", &video_path,
        "-ss", "00:00:01",
        "-vframes", "1",
        "-q:v", "2",
        thumbnail_path.to_str().unwrap(),
    ]);

    let output = cmd.output()
        .await
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    if !output.status.success() {
        // Fallback to 0s
        let mut fallback_cmd = Command::new("ffmpeg");
        fallback_cmd.args(&[
            "-i", &video_path,
            "-ss", "00:00:00",
            "-vframes", "1",
            thumbnail_path.to_str().unwrap(),
        ]);
        
        let fallback_output = fallback_cmd.output()
            .await
            .map_err(|e| format!("Failed to run ffmpeg fallback: {}", e))?;

        if !fallback_output.status.success() {
            return Err(format!("ffmpeg failed: {}", String::from_utf8_lossy(&fallback_output.stderr)));
        }
    }

    Ok(thumbnail_path.to_str().unwrap().to_string())
}
