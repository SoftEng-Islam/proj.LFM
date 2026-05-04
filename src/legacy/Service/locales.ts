import { writeData, readData } from '@/services/tauri-bridge';
import { locale } from '@tauri-apps/plugin-os';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocaleCode = string; // e.g. "en-US", "ar-EG", "fr-FR"

export interface LocaleInfo {
    /** BCP-47 locale code, e.g. "en-US" */
    code: LocaleCode;
    /** Language portion only, e.g. "en" */
    language: string;
    /** Region portion if present, e.g. "US" */
    region: string | null;
    /** Whether text flows right-to-left for this locale */
    isRTL: boolean;
}

// ─── RTL language list ────────────────────────────────────────────────────────

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'ku', 'ps', 'sd', 'ug', 'dv']);

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a BCP-47 locale code string into a `LocaleInfo` object.
 *
 * @param code - A locale string such as `"en-US"`, `"ar-EG"`, or `"fr"`
 */
export function parseLocale(code: LocaleCode): LocaleInfo {
    const [language = 'en', region = null] = code.split('-') as [string, string | undefined];
    return {
        code,
        language: language.toLowerCase(),
        region: region ? region.toUpperCase() : null,
        isRTL: RTL_LANGUAGES.has(language.toLowerCase()),
    };
}

// ─── OS locale ───────────────────────────────────────────────────────────────

/**
 * Return the locale currently configured in the operating system.
 * Falls back to `"en-US"` if the OS locale cannot be determined.
 *
 * Uses Tauri's `@tauri-apps/plugin-os` locale API.
 */
export async function getSystemLocale(): Promise<LocaleInfo> {
    try {
        const raw = await locale();
        const code = raw ?? 'en-US';
        return parseLocale(code);
    } catch {
        return parseLocale('en-US');
    }
}

// ─── Persisted user preference ────────────────────────────────────────────────

/**
 * Return the locale the user has explicitly chosen and saved,
 * or `null` if no preference has been stored yet.
 */
export async function getSavedLocale(): Promise<LocaleInfo | null> {
    const result = await readData(STORAGE_KEY);
    if (!result.status || typeof result.data !== 'string' || !result.data) {
        return null;
    }
    return parseLocale(result.data);
}

/**
 * Persist a locale preference to disk.
 *
 * @param code - BCP-47 locale code to save (e.g. `"fr-FR"`)
 */
export async function saveLocale(code: LocaleCode): Promise<void> {
    await writeData(STORAGE_KEY, code);
}

/**
 * Remove the saved locale preference, reverting to the OS default.
 */
export async function clearSavedLocale(): Promise<void> {
    await writeData(STORAGE_KEY, null);
}

// ─── Active locale resolution ─────────────────────────────────────────────────

/**
 * Return the active locale to use for the application.
 *
 * Resolution order:
 *   1. User's saved preference (if any)
 *   2. Operating system locale
 *   3. Hard-coded fallback `"en-US"`
 */
export async function getActiveLocale(): Promise<LocaleInfo> {
    const saved = await getSavedLocale();
    if (saved) return saved;
    return getSystemLocale();
}

/**
 * Return `true` if the active locale uses right-to-left text direction.
 * Useful for applying `dir="rtl"` to the document root.
 */
export async function isActiveLocaleRTL(): Promise<boolean> {
    const info = await getActiveLocale();
    return info.isRTL;
}

/**
 * Return just the language code (without region) of the active locale.
 * e.g. `"en"`, `"ar"`, `"fr"`
 */
export async function getActiveLanguage(): Promise<string> {
    const info = await getActiveLocale();
    return info.language;
}

// ─── Document helpers ─────────────────────────────────────────────────────────

/**
 * Apply the active locale to the HTML document root element:
 *  - Sets `document.documentElement.lang` to the locale code
 *  - Sets `document.documentElement.dir` to `"rtl"` or `"ltr"` accordingly
 *
 * Call this once on app startup after mounting Vue.
 */
export async function applyLocaleToDocument(): Promise<void> {
    const info = await getActiveLocale();
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.isRTL ? 'rtl' : 'ltr';
}

/**
 * Update the locale preference, persist it, and re-apply it to the document.
 *
 * @param code - BCP-47 locale code to switch to
 */
export async function switchLocale(code: LocaleCode): Promise<LocaleInfo> {
    await saveLocale(code);
    const info = parseLocale(code);
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.isRTL ? 'rtl' : 'ltr';
    return info;
}

// ─── Supported locales ────────────────────────────────────────────────────────

/**
 * A curated list of locales that the application UI has been localised for.
 * Extend this list as new translations are added via Crowdin.
 */
export const SUPPORTED_LOCALES: { code: LocaleCode; label: string }[] = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'es-ES', label: 'Español' },
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'ar-SA', label: 'العربية' },
    { code: 'zh-CN', label: '中文 (简体)' },
    { code: 'zh-TW', label: '中文 (繁體)' },
    { code: 'ja-JP', label: '日本語' },
    { code: 'ko-KR', label: '한국어' },
    { code: 'ru-RU', label: 'Русский' },
    { code: 'tr-TR', label: 'Türkçe' },
    { code: 'it-IT', label: 'Italiano' },
    { code: 'pl-PL', label: 'Polski' },
    { code: 'nl-NL', label: 'Nederlands' },
];

/**
 * Check whether a given locale code is in the supported locales list.
 *
 * @param code - BCP-47 locale code to check
 */
export function isSupportedLocale(code: LocaleCode): boolean {
    return SUPPORTED_LOCALES.some((l) => l.code === code || l.code.split('-')[0] === code.split('-')[0]);
}

/**
 * Find the best match from `SUPPORTED_LOCALES` for a given locale code.
 *
 * Matching priority:
 *   1. Exact match (e.g. `"fr-FR"`)
 *   2. Language-only match (e.g. `"fr"` → `"fr-FR"`)
 *   3. Falls back to `"en-US"`
 *
 * @param code - BCP-47 locale code to find a match for
 */
export function bestMatchLocale(code: LocaleCode): { code: LocaleCode; label: string } {
    const exact = SUPPORTED_LOCALES.find((l) => l.code === code);
    if (exact) return exact;

    const lang = code.split('-')[0]!.toLowerCase();
    const langMatch = SUPPORTED_LOCALES.find((l) => l.code.split('-')[0]!.toLowerCase() === lang);
    if (langMatch) return langMatch;

    return SUPPORTED_LOCALES[0]!; // en-US fallback
}
