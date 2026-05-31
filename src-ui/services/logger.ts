import { attachConsole, debug as tauriDebug, info as tauriInfo, warn as tauriWarn, error as tauriError } from "@tauri-apps/plugin-log";

const formatArgs = (args: unknown[]): string => {
    return args
        .map((item) => {
            if (typeof item === "string") return item;
            try {
                return JSON.stringify(item);
            } catch {
                return String(item);
            }
        })
        .join(" ");
};

export async function initializeLogger(): Promise<void> {
    try {
        await attachConsole();
    } catch (error) {
        console.warn("[Logger] attachConsole failed", error);
    }
}

function normalizeKeyValues(keyValues?: Record<string, unknown>): Record<string, string | undefined> | undefined {
    if (!keyValues) return undefined;

    const normalized: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(keyValues)) {
        if (value === undefined) {
            normalized[key] = undefined;
            continue;
        }
        if (typeof value === "string") {
            normalized[key] = value;
            continue;
        }
        if (value === null) {
            normalized[key] = "null";
            continue;
        }
        try {
            normalized[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
        } catch {
            normalized[key] = String(value);
        }
    }
    return normalized;
}

export function debug(message: string, keyValues?: Record<string, unknown>): void {
    console.debug("[Logger]", message, keyValues ?? "");
    const options = normalizeKeyValues(keyValues);
    void tauriDebug(message, options ? { keyValues: options } : undefined).catch((error) => {
        console.debug("[Logger] tauri debug failed", error);
    });
}

export function info(message: string, keyValues?: Record<string, unknown>): void {
    console.info("[Logger]", message, keyValues ?? "");
    const options = normalizeKeyValues(keyValues);
    void tauriInfo(message, options ? { keyValues: options } : undefined).catch((error) => {
        console.warn("[Logger] tauri info failed", error);
    });
}

export function warn(message: string, keyValues?: Record<string, unknown>): void {
    console.warn("[Logger]", message, keyValues ?? "");
    const options = normalizeKeyValues(keyValues);
    void tauriWarn(message, options ? { keyValues: options } : undefined).catch((error) => {
        console.warn("[Logger] tauri warn failed", error);
    });
}

export function error(message: string, keyValues?: Record<string, unknown>): void {
    console.error("[Logger]", message, keyValues ?? "");
    const options = normalizeKeyValues(keyValues);
    void tauriError(message, options ? { keyValues: options } : undefined).catch((err) => {
        console.error("[Logger] tauri error failed", err);
    });
}

export function debugArgs(...args: unknown[]): void {
    debug(formatArgs(args), { args });
}
