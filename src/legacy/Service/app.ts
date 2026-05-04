import {
    checkVscodeInstalled,
    getAvailableFonts,
    changeTransparentEffect,
    enableShadowEffect,
    listenStylesheetChange,
    readData,
    writeData,
} from '@/services/tauri-bridge';

// ─── App Version / Info ──────────────────────────────────────────────────────

/**
 * Return the app version string from Tauri's package metadata.
 * Falls back to the VITE_APP_VERSION env variable if not running inside Tauri.
 */
export async function getAppVersion(): Promise<string> {
    try {
        const { getVersion } = await import('@tauri-apps/api/app');
        return getVersion();
    } catch {
        return import.meta.env.VITE_APP_VERSION ?? '0.0.0';
    }
}

/**
 * Return the application name from Tauri's package metadata.
 */
export async function getAppName(): Promise<string> {
    try {
        const { getName } = await import('@tauri-apps/api/app');
        return getName();
    } catch {
        return import.meta.env.VITE_APP_NAME ?? 'LFM';
    }
}

/**
 * Return the Tauri framework version string.
 */
export async function getTauriVersion(): Promise<string> {
    try {
        const { getTauriVersion: _get } = await import('@tauri-apps/api/app');
        return _get();
    } catch {
        return 'unknown';
    }
}

// ─── System Fonts ────────────────────────────────────────────────────────────

/**
 * Return a sorted list of all font family names installed on the system.
 * Results are cached in sessionStorage to avoid repeated IPC calls.
 */
export async function listSystemFonts(): Promise<string[]> {
    const cacheKey = 'lfm:system-fonts';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached) as string[];
        } catch {
            // ignore malformed cache
        }
    }

    const fonts = await getAvailableFonts();
    const sorted = [...fonts].sort((a, b) => a.localeCompare(b));
    sessionStorage.setItem(cacheKey, JSON.stringify(sorted));
    return sorted;
}

// ─── VS Code Integration ─────────────────────────────────────────────────────

/**
 * Check whether Visual Studio Code is available on the system PATH.
 * Result is cached in sessionStorage so the check only runs once per session.
 */
export async function isVscodeInstalled(): Promise<boolean> {
    const cacheKey = 'lfm:vscode-installed';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
        return cached === 'true';
    }

    const installed = await checkVscodeInstalled();
    sessionStorage.setItem(cacheKey, String(installed));
    return installed;
}

// ─── Window Appearance ───────────────────────────────────────────────────────

/**
 * Apply a transparency effect to the native window frame.
 *
 * Supported effects:
 *  - `"blur"`     — Gaussian blur (Windows 10/11)
 *  - `"acrylic"`  — Acrylic material (Windows 10/11)
 *  - `"mica"`     — Mica material (Windows 11 only)
 *  - `"vibrancy"` — NSVisualEffectView (macOS)
 *  - `"none"`     — Remove any active effect
 *
 * This is a no-op on Linux.
 */
export async function applyWindowEffect(effect: string): Promise<void> {
    return changeTransparentEffect(effect);
}

/**
 * Enable or disable the drop-shadow around the window border.
 * This is a no-op on Linux.
 *
 * @param enabled - `true` to show the shadow, `false` to remove it
 */
export async function setWindowShadow(enabled: boolean): Promise<void> {
    return enableShadowEffect(enabled);
}

/**
 * Load the saved appearance preferences and apply the window effect and shadow
 * settings stored under the `"appearance"` storage key.
 *
 * Called once on startup from `main.ts`.
 */
export async function applyStoredAppearance(): Promise<void> {
    const result = await readData('appearance');
    if (!result.status || !result.data || typeof result.data !== 'object') return;

    const data = result.data as Record<string, unknown>;

    const effect = typeof data['transparentEffect'] === 'string' ? data['transparentEffect'] : 'none';
    const shadow = typeof data['shadowEffect'] === 'boolean' ? data['shadowEffect'] : true;

    await applyWindowEffect(effect);
    await setWindowShadow(shadow);
}

/**
 * Persist appearance preferences (transparent effect + shadow) to storage.
 *
 * @param effect  - The transparency effect name (e.g. `"mica"`, `"none"`)
 * @param shadow  - Whether the drop-shadow should be enabled
 */
export async function saveAppearancePreference(effect: string, shadow: boolean): Promise<void> {
    await writeData('appearance', { transparentEffect: effect, shadowEffect: shadow });
    await applyWindowEffect(effect);
    await setWindowShadow(shadow);
}

// ─── Stylesheet Extension Listener ───────────────────────────────────────────

/**
 * Ask the backend to start watching the custom stylesheet file (if any) for
 * changes. The backend will emit `stylesheet_changes` events whenever the file
 * is modified on disk.
 *
 * This is a fire-and-forget call — the backend manages the watcher lifetime.
 * Use `listenStylesheetChanges` from `Service/window.ts` to react to those events
 * on the frontend side.
 */
export async function startStylesheetWatcher(): Promise<void> {
    return listenStylesheetChange();
}
