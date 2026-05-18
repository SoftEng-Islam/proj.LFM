{ config, pkgs, ... }:

let
  # Runtime shared libraries required by Tauri/WebKitGTK
  libraries = with pkgs; [
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    fontconfig
    libappindicator-gtk3
    openssl
    dbus
    
    # Networking modules for WebKitGTK (essential for TLS/HTTPS in the webview)
    glib-networking
    
    # GStreamer (needed for video thumbnailing and media playback inside the webview)
    gst_all_1.gstreamer
    gst_all_1.gst-plugins-base
    gst_all_1.gst-plugins-good
    gst_all_1.gst-plugins-bad
    gst_all_1.gst-plugins-ugly
    gst_all_1.gst-libav
  ];

  # Runtime utilities (like ffmpeg/ffprobe for media metadata)
  runtimePaths = with pkgs; [
    ffmpeg
    ffprobe
    coreutils
  ];
in
{
  # ─── Config File Deployment ────────────────────────────────────────────────
  home.file.".config/LFM/config.toml".text = ''
    [appearance]
    theme = "dark"
    show_hidden = true

    [behavior]
    default_directory = "${config.home.homeDirectory}/Projects"
  '';

  # ─── Global Package Wrapper ────────────────────────────────────────────────
  # This automatically registers LFM globally in the user's path, wrapping the
  # compiled release binary with all GStreamer plugins, networking, FFmpeg,
  # and Tauri library dependencies out of the box!
  home.packages = [
    (pkgs.symlinkJoin {
      name = "lfm-wrapped";
      paths = [
        (pkgs.writeShellScriptBin "lfm" ''
          export GIO_EXTRA_MODULES="${pkgs.glib-networking}/lib/gio/modules"
          export GST_PLUGIN_SYSTEM_PATH_1_0="${pkgs.gst_all_1.gstreamer}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-base}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-good}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-bad}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-ugly}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-libav}/lib/gstreamer-1.0"
          export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath libraries}:$LD_LIBRARY_PATH"
          export PATH="${pkgs.lib.makeBinPath runtimePaths}:$PATH"
          
          # Locates and executes the compiled native binary from your workspace
          if [ -f "${toString ./.}/src-tauri/target/release/lfm" ]; then
            exec "${toString ./.}/src-tauri/target/release/lfm" "$@"
          elif [ -f "${toString ./.}/target/release/lfm" ]; then
            exec "${toString ./.}/target/release/lfm" "$@"
          else
            echo "❌ LFM binary not found! Please run 'pnpm build' or 'cargo build --release' inside ${toString ./.}/ first." >&2
            exit 1
          fi
        '')
      ];
    })
  ];
}
