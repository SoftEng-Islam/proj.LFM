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

    # NEW: MPV library for tauri-plugin-libmpv local development
    mpv
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

    echo "========================================================"
    echo "🎉 Welcome to the LFM Developer Environment (Nix Shell) 🎉"
    echo "========================================================"
    echo "Available tools:"
    echo "  - rustc / cargo (Rust toolchain)"
    echo "  - pnpm / node (Frontend dev server & UI packages)"
    echo "  - libmpv (Media playback backend)"
    echo "  - ffprobe / ffmpegthumbnailer (Metadata & thumbnails)"
    echo "  - WebkitGTK 4.1 (UI Rendering ONLY - No GStreamer!)"
    echo "========================================================"
  '';
}
