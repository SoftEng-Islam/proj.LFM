use sha2::{Sha256, Digest};
use std::fs;
use std::path::Path;
use dirs::cache_dir;
use image::imageops::FilterType;
use ffmpeg_next as ffmpeg;
use ffmpeg::software::scaling::{Context as ScalerContext, flag::Flags};
use ffmpeg::util::format::Pixel;

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

fn extract_video_frame(video_path: &str) -> Result<image::DynamicImage, String> {
    ffmpeg::init().map_err(|e| format!("Failed to init FFmpeg: {}", e))?;
    
    let mut input = ffmpeg::format::input(&video_path)
        .map_err(|e| format!("Failed to open video: {}", e))?;
        
    let video_stream = input.streams()
        .best(ffmpeg::media::Type::Video)
        .ok_or_else(|| "No video stream found".to_string())?;
        
    let video_stream_index = video_stream.index();
    
    let codec_context = ffmpeg::codec::context::Context::from_parameters(video_stream.parameters())
        .map_err(|e| format!("Failed to get codec context: {}", e))?;
        
    let mut decoder = codec_context.decoder().video()
        .map_err(|e| format!("Failed to get video decoder: {}", e))?;
        
    // Seek to 1.0 second (1,000,000 microseconds)
    let _ = input.seek(1_000_000, ..1_000_000);
    
    let mut scaler = ScalerContext::get(
        decoder.format(),
        decoder.width(),
        decoder.height(),
        Pixel::RGB24,
        decoder.width(),
        decoder.height(),
        Flags::BILINEAR,
    ).map_err(|e| format!("Failed to initialize scaler: {}", e))?;
    
    let mut frame = ffmpeg::util::frame::Video::empty();
    let mut rgb_frame = ffmpeg::util::frame::Video::empty();
    
    let mut decoded_frame = false;
    
    for (stream, packet) in input.packets() {
        if stream.index() == video_stream_index {
            if decoder.send_packet(&packet).is_ok() {
                while decoder.receive_frame(&mut frame).is_ok() {
                    scaler.run(&frame, &mut rgb_frame)
                        .map_err(|e| format!("Scaling failed: {}", e))?;
                    decoded_frame = true;
                    break;
                }
            }
        }
        if decoded_frame {
            break;
        }
    }
    
    if !decoded_frame {
        let _ = decoder.send_eof();
        while decoder.receive_frame(&mut frame).is_ok() {
            scaler.run(&frame, &mut rgb_frame)
                .map_err(|e| format!("Scaling failed: {}", e))?;
            decoded_frame = true;
            break;
        }
    }
    
    if !decoded_frame {
        return Err("No video frames could be decoded".to_string());
    }
    
    let width = rgb_frame.width();
    let height = rgb_frame.height();
    let stride = rgb_frame.stride(0);
    let data = rgb_frame.data(0);
    
    let mut rgb_data = Vec::with_capacity((width * height * 3) as usize);
    for y in 0..height {
        let start = (y as usize) * stride;
        let end = start + (width as usize) * 3;
        if end <= data.len() {
            rgb_data.extend_from_slice(&data[start..end]);
        } else {
            return Err("RGB frame data bounds exceeded".to_string());
        }
    }
    
    let rgb_img = image::ImageBuffer::<image::Rgb<u8>, Vec<u8>>::from_raw(width, height, rgb_data)
        .ok_or_else(|| "Failed to create ImageBuffer from RGB data".to_string())?;
        
    Ok(image::DynamicImage::ImageRgb8(rgb_img))
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

    let video_path_clone = video_path.clone();
    let thumb_path_clone = thumbnail_path.clone();
    
    tokio::task::spawn_blocking(move || {
        let img = extract_video_frame(&video_path_clone)?;
        let thumbnail = img.resize(256, 256, FilterType::Lanczos3);
        thumbnail.save(&thumb_path_clone)
            .map_err(|e| format!("Failed to save thumbnail: {}", e))?;
        Ok::<(), String>(())
    }).await.map_err(|e| e.to_string())??;

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
