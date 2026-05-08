#![allow(dead_code)]
use crate::errors::AppResult;
use std::fs;
use std::path::Path;

pub async fn copy(src: String, dest: String) -> AppResult<bool> {
    fs::copy(src, dest)?;
    Ok(true)
}

pub async fn rename(path: String, new_path: String) -> AppResult<bool> {
    fs::rename(path, new_path)?;
    Ok(true)
}

pub async fn remove_dir(path: String) -> AppResult<bool> {
    fs::remove_dir_all(path)?;
    Ok(true)
}

pub async fn remove_file(path: String) -> AppResult<bool> {
    fs::remove_file(path)?;
    Ok(true)
}

pub fn file_exist(file_path: &str) -> bool {
    fs::metadata(file_path).is_ok()
}

pub fn is_dir(path: &Path) -> bool {
    if Path::new(path).exists() {
        fs::metadata(path).map(|m| m.is_dir()).unwrap_or(false)
    } else {
        false
    }
}

pub async fn read_directory_paginated(
    path: String,
    offset: usize,
    limit: usize,
) -> AppResult<Vec<String>> {
    let entries = tokio::task::spawn_blocking(move || {
        let mut results = Vec::new();

        if let Ok(read_dir) = fs::read_dir(path) {
            for (index, entry) in read_dir.enumerate() {
                if index < offset {
                    continue;
                }

                if results.len() >= limit {
                    break;
                }

                if let Ok(entry) = entry {
                    if let Some(name) = entry.file_name().to_str() {
                        results.push(name.to_string());
                    }
                }
            }
        }

        results
    })
    .await
    .map_err(|error| crate::errors::AppError::Operation(error.to_string()))?;

    Ok(entries)
}
