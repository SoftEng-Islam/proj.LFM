# Just Note

1. Font-End (VueJs) and Style Stuff
   1. [] Preloader must have animation that related to the files and drives.
   2. [] Separate `src/features/navigation/components/SidebarNavigation.vue` into a small components.
   3. [] Separate the `src/layouts/AppLayout.vue` into a small components.
   4. [] Make sure that all vue files uses the tailwindcss.
   5. [] I want the Icons In "src/features/storage/views/DrivesOverviewView.vue" in the LFM-drive-card to by dynamic like in `src/features/navigation/components/SidebarNavigation.vue` in drives section, so if drive/path is Usb it takes IconUsb, if HardDisk it takes IconHardDisk, etc...
   6. Replace drive-card SVGs to use the shared `fileIcons.getDriveIconKey` / `LFM-sbar-icon`.
   7. [] The `src/components`, `src/features` and `src/layouts` are very confusing for me
      - [] plan and fix this confusing.
   8. [] AppHeader `src/layouts/components/AppHeader` Improvements:
      1. AppHeader Style must be like "Windows File Explorer".
      2. The "close/minimize/Maximize" buttons must be an optional part.
         1. Implement options to hide/show in the schema.
      3. The AppHeader must follow our styles and themes in this project.
      4. Taps have some effects so the user can notice which tab is active.
   9. The ActionToolbar `src/features/explorer/components/ActionToolbar.vue` needed Improvements:
   10. The NewDropdown have a three actions they doesn't work they create new items only in the ui not in the real disk, fix it.
   11. Combine the viewMode switch buttons (list, grid) to a one beautiful button with animation.
   12. Create a new dropdown menu for the icons size folders and files, with four level small,medium,large,extra large.
   13. The "sort by" button must be a drop down list so the user can select one option instead of just click on a one button, and add more options that may the users need it.
   14. Complete the filter button. make it smart and useful.
2. The AppNavigationBar `src/layouts/components/AppNavigationBar.vue`
   1. The AppBreadcrumb must have the ability to paste/copy the path or write/edit the path, with suggestions while writing/editing with effects like the border will be red if the path is wrong or not exist.
   2. The search box must have advanced tools to search like a specific type of files or folders, etc...
3. The File Icons
   1. Not all files have an icon like:
      1. .html
      2. .mhtml
      3. .ts
      4. .yaml
      5. .envrc

----

## Technical List

1. Support to Hide/Show MOUNT_POINTS.
2. The hidden "Folders and Files" in **linux** starts with '.', So we must make sure these hidden items have a different style and effect like opacity or dim, so we can release(see) them fast.
3. The app must watch the configs in `~/.config/LFM` so when the user change the config, the app reload the new configs. also the settings view and the configs both are the same thing and we must make a schema so both the vue/rust and settings and config file follow it. I mean when we add new option into the schema file its will give us an error in the front-end (vue) if we don't use it, Also the rust side will do the same thing. The settings view must follow the config file, and settings view can update the config file.
4. The keyboard shortcuts
   1. Create a schema for the keyboard key binding.
   2. Centralized keyboard actions for panels, so the ESC can close any window.
   3. The alt with right/left Arrows must work for navigation (Back/forward).
   4. Ctrl+Scroll change the icons size with the same available four options for the icons size.
   5. Shift with arrows for select the files/folders.
   6. Ctrl+space with (arrows to move the hover) to select specific files/folders.
   7. Ctrl + plus/minus key to change the icons size.
   8. (Ctrl + page-up/page-down) and (Ctrl + Shift + Right/Left Arrows) to go through the opened tabs
   9. The Copy, Cut and Paste doesn't work its do nothing. fix it.
   10. F1 key must give us a help window ( window like the settings window ) with a section for the keyboard shortcuts
   11. F2 Only for rename.
   12. F7 Will open the settings window
   13. F3 Will Toggle the Preview pane
   14. F4 Will toggle the AI chat sidebar
   15. F6 will take us to the default path.
   16. "Space" key toggle select for files/folders
   17. ESC to cancel for selected files/folders or opened window like settings window.
5. Implement `ActionToolbar` new-item IPC calls using `src/services/tauri-bridge` functions.

## Rust Stuff, Ideas and Questions

1. Can we use "<https://docs.rs/mpv/latest/mpv/>" as a video player instead of "@videojs-player/vue"
2. To use "@videojs-player/vue" Read: <https://github.com/surmon-china/videojs-player>
3. Read "<https://github.com/staskobzar/vue-audio-visual>" and use Component AvCircle. Vue template name <av-circle> for the audio stuff in preview pane
