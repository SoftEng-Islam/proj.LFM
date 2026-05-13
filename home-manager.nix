{ config, ... }:
{
  home.file.".config/LFM/config.toml".text = ''
    [appearance]
    theme = "dark"
    show_hidden = true

    [behavior]
    default_directory = "${config.home.homeDirectory}/Projects"
  '';
}
