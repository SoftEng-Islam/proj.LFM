{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    pkg-config
    gnumake
    cmake
    gobject-introspection
    cargo
    rustc
    rustup
  ];

  buildInputs = with pkgs; [
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
    strace
    dbus
    openssl
    webkitgtk_4_1
    fontconfig
    libappindicator-gtk3
  ];
}
