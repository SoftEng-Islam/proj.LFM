import type { UnlistenFn } from "@tauri-apps/api/event";
import {
    command,
    destroy,
    init,
    observeProperties,
    setProperty,
    setVideoMarginRatio,
    type MpvConfig,
    type MpvObservableProperty,
} from "tauri-plugin-libmpv-api";

const OBSERVED_PROPERTIES = [
    ["pause", "flag"],
    ["time-pos", "double", "none"],
    ["duration", "double", "none"],
    ["volume", "double"],
    ["filename", "string", "none"],
] as const satisfies MpvObservableProperty[];

const MPV_CONFIG: MpvConfig = {
    initialOptions: {
        vo: "gpu-next",
        hwdec: "auto-safe",
        "keep-open": "yes",
        "force-window": "yes",
        osc: "no",
        "input-default-bindings": "no",
    },
    observedProperties: OBSERVED_PROPERTIES,
};

export interface NativeMediaState {
    isPaused: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    filename: string | null;
}

const defaultState = (): NativeMediaState => ({
    isPaused: true,
    currentTime: 0,
    duration: 0,
    volume: 100,
    filename: null,
});

let initPromise: Promise<string> | null = null;

function log(...args: unknown[]) {
    console.debug("[NativeMediaPlayer]", ...args);
}

async function ensureMpvInitialized(): Promise<string> {
    if (!initPromise) {
        log("Initializing MPV with config", MPV_CONFIG);
        initPromise = init(MPV_CONFIG).catch((error) => {
            initPromise = null;
            log("MPV initialization failed", error);
            throw error;
        });
    }

    return initPromise;
}

export class NativeMediaPlayer {
    private unlisten: UnlistenFn | null = null;
    private readonly stateHandler: (state: NativeMediaState) => void;
    private readonly errorHandler: (message: string) => void;
    private state = defaultState();

    public constructor(stateHandler: (state: NativeMediaState) => void, errorHandler: (message: string) => void) {
        this.stateHandler = stateHandler;
        this.errorHandler = errorHandler;
    }

    public async initialize(): Promise<void> {
        log("Initializing native player...");
        await ensureMpvInitialized();
        await setVideoMarginRatio({ left: 0, right: 0, top: 0, bottom: 0 });
        this.unlisten = await observeProperties(OBSERVED_PROPERTIES, (event) => {
            log("MPV event received", event);
            if (event.event !== "property-change") return;
            this.applyPropertyChange(event.name, event.data);
        });
        log("Native player initialized");
    }

    public async load(filePath: string, autoplay = false): Promise<void> {
        log("Loading media file", filePath, { autoplay });
        await ensureMpvInitialized();
        await command("loadfile", [filePath, "replace"]);
        log("loadfile command sent", filePath);
        await setProperty("pause", !autoplay);
        log("Playback pause state set", !autoplay);
    }

    public async setPaused(paused: boolean): Promise<void> {
        log("Setting paused state", paused);
        await setProperty("pause", paused);
    }

    public async seek(seconds: number): Promise<void> {
        log("Seeking to", seconds);
        await command("seek", [seconds, "absolute"]);
    }

    public async setVolume(volume: number): Promise<void> {
        const normalized = Math.max(0, Math.min(100, volume));
        log("Setting volume", normalized);
        await setProperty("volume", normalized);
    }

    public async dispose(): Promise<void> {
        log("Disposing native player");
        if (this.unlisten) {
            this.unlisten();
            this.unlisten = null;
        }

        await destroy().catch((error) => {
            log("Destroy error", error);
            this.errorHandler(error instanceof Error ? error.message : String(error));
        });
        initPromise = null;
        this.state = defaultState();
    }

    private applyPropertyChange(name: string, data: unknown): void {
        log("Property change", name, data);
        if (name === "pause") {
            if (typeof data === "boolean") {
                this.state.isPaused = data;
            } else if (typeof data === "number") {
                this.state.isPaused = data !== 0;
            } else if (typeof data === "string") {
                this.state.isPaused = data === "yes" || data === "true" || data === "1";
            }
        } else if (name === "time-pos") {
            this.state.currentTime = typeof data === "number" ? data : 0;
        } else if (name === "duration") {
            this.state.duration = typeof data === "number" ? data : 0;
        } else if (name === "volume" && typeof data === "number") {
            this.state.volume = data;
        } else if (name === "filename") {
            this.state.filename = typeof data === "string" ? data : null;
        }

        this.stateHandler({ ...this.state });
    }
}
