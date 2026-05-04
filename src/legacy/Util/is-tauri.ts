/**
 * Check if the app is running inside a Tauri window (v2).
 * Tauri v2 exposes `window.__TAURI_INTERNALS__` instead of `window.__TAURI__`.
 */
const isTauri: boolean = typeof window !== 'undefined' && typeof (window as Record<string, unknown>).__TAURI_INTERNALS__ !== 'undefined';

export default isTauri;
