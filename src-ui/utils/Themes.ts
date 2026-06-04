import { ref } from "vue";
import iconAutoDetect from "@/assets/icons/auto-detect.svg?raw";
import iconSun from "@/assets/icons/sun.svg?raw";
import iconMoon from "@/assets/icons/moon.svg?raw";

export class Themes {
    static #storageKey = "theme";
    static defaultTheme = "system"; // Automatická detekcia
    static availableThemes = [
        { name: "system", label: "System", icon: iconAutoDetect },
        { name: "dark", label: "Default Dark", icon: iconMoon },
        { name: "light", label: "Default Light", icon: iconSun },
        { name: "lsrosepine-dark", label: "RosePine Dark" },
        { name: "lsrosepine", label: "RosePine Light" },
        { name: "lsgruvbox-dark", label: "Gruvbox Dark" },
        { name: "lsgruvbox", label: "Gruvbox Light" },
        { name: "lsnord-dark", label: "Nord Dark" },
        { name: "lsnord", label: "Nord Light" },
        { name: "lsatom-dark", label: "Atom Dark" },
        { name: "lsatom", label: "Atom Light" },
        { name: "lsvscode-dark", label: "VSCode Dark" },
        { name: "lsvscode", label: "VSCode Light" },
        { name: "cupcake-dark", label: "Cupcake Dark" },
        { name: "cupcake", label: "Cupcake Light" },
        { name: "valentine-dark", label: "Valentine Dark" },
        { name: "valentine", label: "Valentine Light" },
        { name: "coffee", label: "Coffee Dark" },
        { name: "coffee-light", label: "Coffee Light" },
    ];
    static currentTheme = ref(Themes.detect());

    // Zistí, akú tému by mal použiť systém
    static detect() {
        const saved = localStorage.getItem(this.#storageKey) || this.defaultTheme;
        if (saved && this.availableThemes.map((theme) => theme.name).includes(saved)) {
            return saved;
        }
        return this.prefersDark() ? "dark" : "light";
    }

    // Aplikuje danú tému a uloží ju do localStorage
    static apply(newTheme: string) {
        if (newTheme === this.defaultTheme) {
            // Uloží "system", ale vzhled na stránce nastaví podle preferencí
            localStorage.setItem(this.#storageKey, "system");
            document.documentElement.setAttribute("data-theme", this.prefersDark() ? "dark" : "light");
        } else {
            // Uloží zvolenou čitelnou hodnotu, např. "dark" nebo "light"
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem(this.#storageKey, newTheme);
        }
        this.currentTheme.value = newTheme;
    }

    static prefersDark() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
}
