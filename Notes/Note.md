# Just Note

1. The Icons In "Storage Overview" in the LFM-drive-card there are svg icons with class "LFM-drive-icon", I don't Like these icons I want to replace them with same icon in LFM-sbar-section in LFM-sbar-icon.
2. The AppHeader `src/layouts/components/AppHeader` needed Improvements:
   1. First We want the AppHeader to be like the windows file explorer in a style way.
   2. The close/minimize/Maximize buttons must be optional part, so the user can hide/show it because some users uses the hyprland with plugins like hyprbars that replace the top title bar for the Applications, and its also contains a close/min/max buttons so we don't these tools twice.
   3. The AppHeader must follow and recept the whole app style and design and colors and support the daisyui themes and the default accent (primary) color and also the dark/light mode.
   4. The taps must be have some effects so the user can notice which tab is active so the active tab have more effects like colors, background and border
   5. The new tab button will create a new tab with the default path (Storage Overview) "/drives"
3. The ActionToolbar `src/features/explorer/components/ActionToolbar.vue` needed Improvements:
   1. The NewDropdown have a three actions they doesn't work they create new items only in the ui not in the real disk, fix it.
   2. Combine the viewMode switch buttons (list, grid) to a one beautiful button with animation.
   3. Create a new dropdown menu for the icons size folders and files, with four level small,medium,large,extra large.
   4. The "sort by" button must be a drop down list so the user can select one option instead of just click on a one button, and add more options that may the users need it.
   5. Complete the filter button. make it smart and useful.
4. The LFM settings `src/features/settings/views/SettingsView.vue`
   1. The LFM-sbar-settings must not move while using the scrollbar.
   2. The LFM settings window needed to be responsive and flexible.
   3. The settings options/value must be exist in the pinia store with default values, if the config file doesn't exist.
   4. Create a separate icons size for the Sidebar Navigation `src/features/navigation/components/SidebarNavigation.vue`
5. The file Icons
   1. Not all files have an icon like:
      1. .html
      2. .mhtml
      3. .ts
      4. .yaml
      5. .envrc
6. The keyboard shortcuts
   1. The alt with right/left Arrows must work for navigation (Back/forward).
   2. Ctrl+Scroll change the icons size with the same available four options for the icons size.
   3. Shift with arrows for select the files/folders.
   4. Ctrl+space with (arrows to move the hover) to select specific files/folders.
   5. Ctrl + plus/minus key to change the icons size.
   6. (Ctrl + page-up/page-down) and (Ctrl + Shift + Right/Left Arrows) to go through the opened tabs
   7. The Copy, Cut and Paste doesn't work its do nothing. fix it.
   8. F1 key must give us a help window ( window like the settings window ) with a section for the keyboard shortcuts
   9. F7 Will open the settings window
   10. F3 Will Toggle the Preview pane
   11. F4 Will toggle the AI chat sidebar
   12. F6 will take us to the default path.
7. The AppNavigationBar `src/layouts/components/AppNavigationBar.vue`
   1. The AppBreadcrumb must have the ability to paste/copy the path or write/edit the path, with suggestions while writing/editing with effects like the border will be red if the path is wrong or not exist.
   2. The search box must have advanced tools to search like a specific type of files or folders, etc...
8. Some Terminal Messages to check:
   1. [@vue/compiler-sfc] `defineEmits` is a compiler macro and no longer needs to be imported.
   2. Warning: 'ozone-platform-hint' is not in the list of known options, but still passed to Electron/Chromium. Warning: 'enable-features' is not in the list of known options, but still passed to Electron/Chromium. Warning: 'enable-wayland-ime' is not in the list of known options, but still passed to Electron/Chromium. Warning: 'wayland-text-input-version' is not in the list of known options, but still passed to Electron/Chromium.
   3. VM 0x79a236416000 on pid 1306771 received NeedDebuggerBreak trap, VM 0x79a236416000 on pid 1306771 received NeedDebuggerBreak trap, VM 0x79a236416000 on pid 1306771 received NeedDebuggerBreak trap
9. .wmv video files doesn't show thumbnails
