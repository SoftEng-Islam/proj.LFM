use tokio::process::Command;
use sha2::{Sha256, Digest};
use std::fs;
use std::path::Path;
use dirs::cache_dir;
use image::imageops::FilterType;

#[tauri::command]
pub async fn get_image_thumbnail(image_path: String) -> Result<String, String> {
    let path = Path::new(&image_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    let cache_base = get_cache_dir()?;
    
    let mut hasher = Sha256::new();
    hasher.update(image_path.as_bytes());
    let hash = hex::encode(hasher.finalize());
    let thumbnail_path = cache_base.join(format!("img_{}.jpg", hash));

    if thumbnail_path.exists() {
        return Ok(thumbnail_path.to_str().unwrap().to_string());
    }

    // Use blocking task for CPU-heavy image processing
    let img_path_clone = image_path.clone();
    let thumb_path_clone = thumbnail_path.clone();
    
    tokio::task::spawn_blocking(move || {
        let img = image::open(&img_path_clone)
            .map_err(|e| format!("Failed to open image: {}", e))?;
        
        let thumbnail = img.resize(256, 256, FilterType::Lanczos3);
        thumbnail.save(&thumb_path_clone)
            .map_err(|e| format!("Failed to save thumbnail: {}", e))?;
        
        Ok::<(), String>(())
    }).await.map_err(|e| e.to_string())??;

    Ok(thumbnail_path.to_str().unwrap().to_string())
}

#[tauri::command]
pub async fn get_video_thumbnail(video_path: String) -> Result<String, String> {
    let path = Path::new(&video_path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    let cache_base = get_cache_dir()?;
    
    let mut hasher = Sha256::new();
    hasher.update(video_path.as_bytes());
    let hash = hex::encode(hasher.finalize());
    let thumbnail_path = cache_base.join(format!("vid_{}.jpg", hash));

    if thumbnail_path.exists() {
        return Ok(thumbnail_path.to_str().unwrap().to_string());
    }

    // Use ffmpegthumbnailer for faster video thumbnails
    let mut cmd = Command::new("ffmpegthumbnailer");
    cmd.args(&[
        "-i", &video_path,
        "-o", thumbnail_path.to_str().unwrap(),
        "-s", "256",
        "-c", "jpeg",
        "-q", "8",
    ]);

    let output = cmd.output()
        .await
        .map_err(|e| format!("Failed to run ffmpegthumbnailer: {}", e))?;

    if !output.status.success() {
        // Fallback to ffmpeg if ffmpegthumbnailer fails
        let mut fallback_cmd = Command::new("ffmpeg");
        fallback_cmd.args(&[
            "-i", &video_path,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-s", "256x256",
            thumbnail_path.to_str().unwrap(),
        ]);
        
        let fallback_output = fallback_cmd.output()
            .await
            .map_err(|e| format!("Failed to run ffmpeg fallback: {}", e))?;

        if !fallback_output.status.success() {
            return Err(format!("Thumbnail generation failed: {}", String::from_utf8_lossy(&fallback_output.stderr)));
        }
    }

    Ok(thumbnail_path.to_str().unwrap().to_string())
}

fn get_cache_dir() -> Result<std::path::PathBuf, String> {
    let cache_base = cache_dir()
        .ok_or_else(|| "Could not find cache directory".to_string())?
        .join("lfm")
        .join("thumbnails");
    
    if !cache_base.exists() {
        fs::create_dir_all(&cache_base).map_err(|e| e.to_string())?;
    }
    
    Ok(cache_base)
}
