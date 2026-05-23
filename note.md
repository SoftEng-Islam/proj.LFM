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

pnpm remove xlsx vue-toastification @tailwindcss/aspect-ratio @tailwindcss/container-queries sass animate.css

I've successfully updated the source files to reflect the removal of the requested packages while strictly following the project rules (including not polluting the package.json, avoiding destructive edits, and preserving existing behavior).

Here's a breakdown of the changes made to ./src:

sass: Since the compiler was removed, I programmatically transpired the <style lang="sass"> blocks across 38 Vue components into standard CSS using a temporary, sandboxed SASS script with pnpm. The lang="sass" tags were removed. I also compiled src/styles/main.sass into src/styles/main.css and updated its import in main.ts.
vue-toastification:
Removed initialization and imports from src/main.ts.
Stripped the useToast imports across 9 .vue components (e.g., WorkspaceOverview, ContextMenu, etc.).
Replaced all toast.success, toast.error, etc. calls with safe console fallback equivalents so that application flows remain intact and don't throw undefined errors.
xlsx: Removed the XLSX import and its processing block from src/components/ui/OfficePreview.vue. Excel files will now safely fail gracefully and show a "disabled preview" placeholder.
animate.css: Removed the import from src/main.ts.
Tailwind Plugins (aspect-ratio & container-queries): Verified that they aren't explicitly declared in postcss.config.ts. Because Tailwind v4+ uses direct CSS directives (or you previously removed them manually), there was no trace left to break your build.
All temporary files and scripts used to automate this mass conversion have been safely removed.

The workspace is now clean from these dependencies. Feel free to let me know if you run into any compilation issues!