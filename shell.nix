{
  pkgs ? import <nixpkgs> { },
}:

let
  # Dynamic libraries required by Tauri, its webview, and MPV at run-time / link-time
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
    freetype

    # Networking modules for WebKitGTK (essential for TLS/HTTPS in the webview)
    glib-networking

    # GStreamer codecs and plugins required for video/audio playback inside WebKitGTK
    # gst_all_1.gstreamer
    # gst_all_1.gst-plugins-base
    # gst_all_1.gst-plugins-good
    # gst_all_1.gst-plugins-bad
    # gst_all_1.gst-plugins-ugly
    # gst_all_1.gst-libav

    # FFmpeg for video/audio codec support (dynamic linking)
    ffmpeg-full

    # Tool to get/set ATA/SATA drive parameters under Linux
    hdparm
  ];

  # Build tools and utilities needed inside the shell
  packages = with pkgs; [
    # Rust toolchain
    cargo
    rustc
    rustup

    # Frontend build tools
    nodejs_20
    nodePackages.pnpm

    # NEW: Metadata and thumbnailing tools
    ffmpeg # Kept for ffprobe metadata extraction
    ffmpegthumbnailer # Added so you can test the sidecar approach locally

    # Native compiler utilities
    pkg-config
    gnumake
    cmake
    gobject-introspection
    strace
    file
    llvmPackages.libclang
    rustPlatform.bindgenHook
  ];
in
pkgs.mkShell {
  nativeBuildInputs = packages;
  buildInputs = libraries;

  shellHook = ''
    # Enable TLS/HTTPS support in WebKitGTK webview
    export GIO_EXTRA_MODULES="${pkgs.glib-networking}/lib/gio/modules"

    # Set dynamic linker library path so the compiled binary finds GTK, WebKit, OpenSSL, and MPV
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath libraries}:$LD_LIBRARY_PATH"

    # WebKitGTK relies on GStreamer plugins for HTML5 video/audio playback.
    export GST_PLUGIN_SYSTEM_PATH_1_0="${pkgs.gst_all_1.gstreamer}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-base}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-good}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-bad}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-ugly}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-libav}/lib/gstreamer-1.0"
    export GST_PLUGIN_PATH_1_0="$GST_PLUGIN_SYSTEM_PATH_1_0"

    # Fix known WebKitGTK video playback issues on NixOS/Linux
    export WEBKIT_DISABLE_COMPOSITING_MODE=1
    export WEBKIT_DISABLE_DMABUF_RENDERER=1

    echo "========================================================"
    echo "🎉 Welcome to the LFM Developer Environment (Nix Shell) 🎉"
    echo "========================================================"
    echo "Available tools:"
    echo "  - rustc / cargo (Rust toolchain)"
    echo "  - pnpm / node (Frontend dev server & UI packages)"
    echo "  - libmpv (Media playback backend)"
    echo "  - ffprobe / ffmpegthumbnailer (Metadata & thumbnails)"
    echo "  - WebkitGTK 4.1 (UI Rendering + GStreamer video/audio support)"
    echo "========================================================"
  '';
}
