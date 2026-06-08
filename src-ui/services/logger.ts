import { attachConsole, debug as tauriDebug, info as tauriInfo, warn as tauriWarn, error as tauriError } from "@tauri-apps/plugin-log";

export interface LogEntry {
    id: string;
    timestamp: string;
    level: "debug" | "info" | "warn" | "error";
    message: string;
    keyValues?: Record<string, unknown>;
}

const history: LogEntry[] = [];
const listeners = new Set<(entry: LogEntry) => void>();

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

function pushLog(entry: LogEntry) {
    history.push(entry);
    if (history.length > 200) {
        history.shift();
    }
    listeners.forEach((listener) => listener(entry));
}

export function getLogHistory(): LogEntry[] {
    return [...history];
}

export function subscribeLogEntries(listener: (entry: LogEntry) => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export async function initializeLogger(): Promise<void> {
    try {
        await attachConsole();
    } catch (error) {
        console.warn("[Logger] attachConsole failed", error);
    }
}

export function debug(message: string, keyValues?: Record<string, unknown>): void {
    console.debug("[Logger]", message, keyValues ?? "");
    pushLog({
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "debug",
        message,
        keyValues,
    });
    void tauriDebug(message, { keyValues }).catch((error) => {
        console.debug("[Logger] tauri debug failed", error);
    });
}

export function info(message: string, keyValues?: Record<string, unknown>): void {
    console.info("[Logger]", message, keyValues ?? "");
    pushLog({
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message,
        keyValues,
    });
    void tauriInfo(message, { keyValues }).catch((error) => {
        console.warn("[Logger] tauri info failed", error);
    });
}

export function warn(message: string, keyValues?: Record<string, unknown>): void {
    console.warn("[Logger]", message, keyValues ?? "");
    pushLog({
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "warn",
        message,
        keyValues,
    });
    void tauriWarn(message, { keyValues }).catch((error) => {
        console.warn("[Logger] tauri warn failed", error);
    });
}

export function error(message: string, keyValues?: Record<string, unknown>): void {
    console.error("[Logger]", message, keyValues ?? "");
    pushLog({
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "error",
        message,
        keyValues,
    });
    void tauriError(message, { keyValues }).catch((err) => {
        console.error("[Logger] tauri error failed", err);
    });
}

export function debugArgs(...args: unknown[]): void {
    debug(formatArgs(args), { args });
}
