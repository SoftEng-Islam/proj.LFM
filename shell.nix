{
  pkgs ? import <nixpkgs> { },
}:

let
  # Dynamic libraries required by Tauri and its webview at run-time / link-time
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

  # Build tools and utilities needed inside the shell
  packages = with pkgs; [
    # Rust toolchain
    cargo
    rustc
    rustup

    # Frontend build tools
    nodejs_20
    nodePackages.pnpm

    # Technical metadata and media utilities (essential for media probing/thumbnailing)
    # ffmpeg contains ffplay, ffprobe and ffprobe, which is used by the media metadata backend to extract technical metadata from media files
    ffmpeg

    # Native compiler utilities
    pkg-config
    gnumake
    cmake
    gobject-introspection
    strace
    file
  ];
in
pkgs.mkShell {
  nativeBuildInputs = packages;
  buildInputs = libraries;

  shellHook = ''
    # Enable TLS/HTTPS support in WebKitGTK webview
    export GIO_EXTRA_MODULES="${pkgs.glib-networking}/lib/gio/modules"

    # Expose GStreamer plugins so media playback and thumbnails work in the webview
    export GST_PLUGIN_SYSTEM_PATH_1_0="${pkgs.gst_all_1.gstreamer}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-base}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-good}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-bad}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-plugins-ugly}/lib/gstreamer-1.0:${pkgs.gst_all_1.gst-libav}/lib/gstreamer-1.0"

    # Set dynamic linker library path so the compiled binary finds GTK, WebKit, and OpenSSL
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath libraries}:$LD_LIBRARY_PATH"

    echo "========================================================"
    echo "🎉 Welcome to the LFM Developer Environment (Nix Shell) 🎉"
    echo "========================================================"
    echo "Available tools:"
    echo "  - rustc / cargo (Rust toolchain)"
    echo "  - pnpm / node (Frontend dev server & UI packages)"
    echo "  - ffprobe / ffmpeg (Media metadata backend)"
    echo "  - WebkitGTK 4.1 + GStreamer plugins configured"
    echo "========================================================"
  '';
}
