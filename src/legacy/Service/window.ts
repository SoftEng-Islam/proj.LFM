import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { changeTransparentEffect, enableShadowEffect } from '@/services/tauri-bridge';

// ─── Window Controls ─────────────────────────────────────────────────────────

/**
 * Minimise the current Tauri window.
 */
export async function minimizeWindow(): Promise<void> {
    await getCurrentWindow().minimize();
}

/**
 * Toggle between maximised and restored state.
 */
export async function toggleMaximize(): Promise<void> {
    const win = getCurrentWindow();
    const isMax = await win.isMaximized();
    if (isMax) {
        await win.unmaximize();
    } else {
        await win.maximize();
    }
}

/**
 * Close the current Tauri window (and exit the app if it is the last window).
 */
export async function closeWindow(): Promise<void> {
    await getCurrentWindow().close();
}

/**
 * Check whether the current window is maximised.
 */
export async function isMaximized(): Promise<boolean> {
    return getCurrentWindow().isMaximized();
}

/**
 * Check whether the current window is fullscreen.
 */
export async function isFullscreen(): Promise<boolean> {
    return getCurrentWindow().isFullscreen();
}

// ─── Window Appearance ───────────────────────────────────────────────────────

/**
 * Apply a transparency / blur effect to the window frame.
 *
 * Supported values:
 *  - `"blur"`     — Gaussian blur (Windows)
 *  - `"acrylic"`  — Acrylic material (Windows 10/11)
 *  - `"mica"`     — Mica material (Windows 11 only)
 *  - `"vibrancy"` — NSVisualEffectView (macOS)
 *  - `"none"`     — Remove any active effect
 *
 * No-op on Linux.
 */
export async function applyTransparentEffect(effect: string): Promise<void> {
    return changeTransparentEffect(effect);
}

/**
 * Enable or disable the drop-shadow around the window border.
 * No-op on Linux.
 *
 * @param enabled - Pass `true` to enable the shadow, `false` to remove it
 */
export async function setShadowEffect(enabled: boolean): Promise<void> {
    return enableShadowEffect(enabled);
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

/**
 * Listen for the `update_theme` event emitted by the backend when a new
 * `.xtension` theme is installed.  Returns an unlisten function — call it
 * to stop listening.
 *
 * @example
 * const stop = await listenUpdateTheme(() => reloadTheme());
 * // later …
 * stop();
 */
export async function listenUpdateTheme(handler: () => void): Promise<UnlistenFn> {
    return listen('update_theme', handler);
}

/**
 * Listen for `stylesheet_changes` events emitted when a custom stylesheet
 * file (passed via `--theme`) is modified on disk.
 *
 * The payload is the newly-parsed stylesheet JSON value.
 *
 * @param handler  - Called with the updated stylesheet value on each change
 */
export async function listenStylesheetChanges(handler: (value: unknown) => void): Promise<UnlistenFn> {
    return listen<unknown>('stylesheet_changes', (event) => {
        handler(event.payload);
    });
}

/**
 * Listen for window focus events.
 * Useful for refreshing directory contents when the user switches back to the app.
 *
 * @param handler - Called each time the window gains focus
 */
export async function onWindowFocus(handler: () => void): Promise<UnlistenFn> {
    return getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (focused) handler();
    });
}

/**
 * Listen for window resize events.
 *
 * @param handler - Called with `{ width, height }` in physical pixels on each resize
 */
export async function onWindowResize(handler: (size: { width: number; height: number }) => void): Promise<UnlistenFn> {
    return getCurrentWindow().onResized(({ payload: size }) => {
        handler({ width: size.width, height: size.height });
    });
}

/**
 * Listen for the window close-requested event.
 * Call `event.preventDefault()` inside the handler to cancel the close.
 *
 * @param handler - Called when the user requests the window to be closed
 */
export async function onCloseRequested(handler: () => void | Promise<void>): Promise<UnlistenFn> {
    return getCurrentWindow().onCloseRequested(async () => {
        await handler();
    });
}
