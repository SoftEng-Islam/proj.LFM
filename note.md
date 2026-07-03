# remove and replace packages

xlsx
vue-toastification
@tailwindcss/aspect-ratio
@tailwindcss/container-queries
pug
vite-plugin-pug
vue-pug-plugin
sass
animate.css

---

While we are working on this project which is a file manager for linux, we need to get some information about the system that we are working with, like the window manager, but why we need such information, for example to change the functionality of the header buttons (Minimise, Maximise, and close )

---

# The Preview Canvas Selected Item icon

In the workspace in grid-view or list-view all items have a icon based on the type of the file or folder, and this great but in the preview canvas all items files have a one static file icon, I want it to show the icon of the selected one.

**Files to check before start editing**:

- src-ui/modules/right-preview-panel/PreviewPane.vue
- src-ui/views/FileManagerView.vue

---

# Actions with Effects

When I Start to select an Items in the workspace whether it is a file of dir and then try to cut with CTRL+X it or the context-menu doesn't change the opacity of the selected items, it must give it a some different style and opacity so the user know which one we will move or cut.
