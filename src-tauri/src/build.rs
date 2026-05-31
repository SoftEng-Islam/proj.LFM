use std::{env, fs, path::PathBuf};

fn main() {
    tauri_build::build();
    if let Err(error) = install_mpv_wrapper() {
        println!("cargo:warning=libmpv-wrapper helper: {}", error);
    }
}

fn install_mpv_wrapper() -> Result<(), Box<dyn std::error::Error>> {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR")?);
    let lib_dir = manifest_dir.join("lib");

    let wrapper_file = match env::var("CARGO_CFG_TARGET_OS")?.as_str() {
        "windows" => "libmpv-wrapper.dll",
        "macos" => "libmpv-wrapper.dylib",
        "linux" => "libmpv-wrapper.so",
        other => {
            return Err(format!(
                "Unsupported target OS '{}' for native libmpv wrapper installation.",
                other
            )
            .into())
        }
    };

    let source_path = lib_dir.join(wrapper_file);
    if !source_path.exists() {
        return Err(format!(
            "Missing '{}' in '{}'.\nPlease download the correct libmpv-wrapper release from https://github.com/nini22P/libmpv-wrapper/releases and place it into the src-tauri/lib directory.",
            wrapper_file,
            lib_dir.display()
        )
        .into());
    }

    let out_dir = PathBuf::from(env::var("OUT_DIR")?);
    let target_profile_dir = out_dir
        .ancestors()
        .nth(3)
        .ok_or("Unable to determine cargo target profile directory from OUT_DIR")?
        .to_path_buf();

    let dest_dir = target_profile_dir.join("lib");
    fs::create_dir_all(&dest_dir)?;
    fs::copy(&source_path, dest_dir.join(wrapper_file))?;

    println!("cargo:warning=Copied native wrapper '{}' to {}", wrapper_file, dest_dir.display());
    Ok(())
}
