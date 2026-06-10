/**
 * File Manager store — the primary store for the explorer UI.
 *
 * Responsibilities:
 * - Current path and directory entries
 * - Sorting, filtering, and search
 * - File selection
 * - Tab management
 * - Drive list
 * - Clipboard (copy/cut/paste)
 * - File operations (delete, rename, open)
 *
 * Drive/file mapping is delegated to `@/services/mappers`.
 * NOTE: Panel resize logic (`usePanelResize`) should be handled at the component level
 * as it cannot be seamlessly destructured into an Options Store.
 */

import { useStorage } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";

import { defaultPath, createNavigationGroups, createInitialTabs, driveCards as initialDriveCards } from "@/modules/left-navigation/navigation";
import { initHomeDirFromStorage } from "@/composables/useFilesystem";
import { mapDriveInfoToCard, mapTrashMetaToEntry } from "@/services/mappers";
import {
    convertFileSrc,
    copy as tauriCopy,
    createDirRecursive,
    deleteFile,
    fileExist,
    getDrives,
    getFilePermissions,
    getMediaInfo,
    getImageThumbnail,
    getVideoThumbnail,
    getTrashedItems,
    isDir,
    openFile,
    openInTerminal as tauriOpenTerminal,
    readDirectory,
    rename as tauriMove,
    writeTextFile,
} from "@/services/tauri-bridge";
import { formatBytes } from "@/utils/format";
import type {
    ActivityEntry,
    BreadcrumbSegment,
    DriveCard,
    FileEntry,
    FilePermissions,
    MediaInfo,
    NavigationGroup,
    SortMode,
    ViewMode,
    WindowTab,
    WorkspaceStat,
} from "@/types/file-manager";

const NAV_WIDTH = 240;

const MIN_RIGHT_PANEL = 260;
const MAX_RIGHT_PANEL = 720;

const MIN_MAIN_CONTENT = 360;

const MIN_STATUS_BAR_HEIGHT = 100;

//! FIXME why I can't change the statusbar height to this value
const MAX_STATUS_BAR_HEIGHT = 600;

const DEFAULT_LEFT_SIDEBAR_WIDTH = 360;
const DEFAULT_DETAILS_PANEL_WIDTH = 360;
const DEFAULT_AI_CHAT_PANEL_WIDTH = 320;
const DEFAULT_STATUS_BAR_HEIGHT = 225;

export const useFileManagerStore = defineStore("file-manager", {
    // ── State ─────────────────────────────────────────────────────────────────
    state: () => ({
        currentPath: defaultPath,
        homePath: defaultPath,
        currentEntries: [] as FileEntry[],
        searchQuery: "",
        selectedItemIds: new Set<string>(),
        DEFAULT_LEFT_SIDEBAR_WIDTH: DEFAULT_LEFT_SIDEBAR_WIDTH,
        DEFAULT_DETAILS_PANEL_WIDTH: DEFAULT_DETAILS_PANEL_WIDTH,
        DEFAULT_AI_CHAT_PANEL_WIDTH: DEFAULT_AI_CHAT_PANEL_WIDTH,

        // Status Bar
        DEFAULT_STATUS_BAR_HEIGHT: DEFAULT_STATUS_BAR_HEIGHT,
        MIN_STATUS_BAR_HEIGHT: MIN_STATUS_BAR_HEIGHT,
        MAX_STATUS_BAR_HEIGHT: MAX_STATUS_BAR_HEIGHT,

        // Pinia automatically unwraps refs, so useStorage works here
        viewMode: useStorage<ViewMode>("lfm-view-mode", "grid"),
        sortMode: useStorage<SortMode>("lfm-sort-mode", "modified"),

        settingsOpen: false,
        showHiddenFiles: false,
        showMountPoints: false,
        hiddenFilesVisualStyle: "dimmed" as "dimmed" | "normal" | "blurred",

        clipboard: {
            paths: [] as string[],
            mode: null as "copy" | "cut" | null,
        },

        leftSidebarOpen: true,
        detailsOpen: true,
        aiChatOpen: false,
        statusBarOpen: true,
        leftSidebarWidth: useStorage<number>("lfm-left-sidebar-width", DEFAULT_LEFT_SIDEBAR_WIDTH),
        detailsPanelWidth: useStorage<number>("lfm-details-panel-width", DEFAULT_DETAILS_PANEL_WIDTH),
        aiChatPanelWidth: useStorage<number>("lfm-ai-chat-panel-width", DEFAULT_AI_CHAT_PANEL_WIDTH),
        statusBarHeight: useStorage<number>("lfm-status-bar-height", DEFAULT_STATUS_BAR_HEIGHT),

        isLoading: false,
        isInitialized: false,

        navError: null as {
            kind: "permission" | "not-found" | "unknown";
            path: string;
            message: string;
        } | null,

        driveCards: initialDriveCards as DriveCard[],
        windowTabs: createInitialTabs(defaultPath) as WindowTab[],
        activeTabId: "",
        navigationGroups: createNavigationGroups(defaultPath) as NavigationGroup[],
        favoriteItems: [] as string[],
        selectedItemPermissions: null as FilePermissions | null,
        selectedItemMediaInfo: null as MediaInfo | null,
        expandedPreviewId: null as string | null,
    }),

    // ── Getters (Computed) ────────────────────────────────────────────────────
    getters: {
        navigationGroupsWithCounts: (state): NavigationGroup[] => {
            return state.navigationGroups.map((group) => ({
                ...group,
                items: group.items.map((item) => ({ ...item, count: 0 })),
            }));
        },

        tabsWithAccent: (state): WindowTab[] => {
            return state.windowTabs.map((tab) => ({ ...tab, accent: "slate" as const }));
        },

        sortedAndFilteredEntries(state): FileEntry[] {
            const source = state.showHiddenFiles ? [...state.currentEntries] : state.currentEntries.filter((entry) => !entry.isHidden);
            const query = state.searchQuery.trim().toLowerCase();

            const filtered = query
                ? source.filter((entry) => {
                      const haystack = [entry.name, entry.typeLabel, ...entry.tags].join(" ").toLowerCase();
                      return haystack.includes(query);
                  })
                : source;

            return filtered.sort((left, right) => {
                if (left.kind === "folder" && right.kind !== "folder") return -1;
                if (left.kind !== "folder" && right.kind === "folder") return 1;

                switch (state.sortMode) {
                    case "name":
                        return left.name.localeCompare(right.name);
                    case "size":
                        return right.sortSize - left.sortSize;
                    case "kind":
                        return left.typeLabel.localeCompare(right.typeLabel);
                    case "modified":
                    default:
                        return new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
                }
            });
        },

        selectedItem(state): FileEntry | null {
            const firstId = state.selectedItemIds.values().next().value;
            if (firstId) {
                const match = this.sortedAndFilteredEntries.find((e: FileEntry) => e.id === firstId);
                if (match) return match;
            }
            return this.sortedAndFilteredEntries[0] ?? null;
        },

        selectedItems(state): FileEntry[] {
            return this.sortedAndFilteredEntries.filter((e: FileEntry) => state.selectedItemIds.has(e.id));
        },

        spotlightItems(): FileEntry[] {
            const dirs = this.sortedAndFilteredEntries.filter((e: FileEntry) => e.kind === "folder").slice(0, 3);
            return dirs.length ? dirs : this.sortedAndFilteredEntries.slice(0, 3);
        },

        breadcrumbs(state): BreadcrumbSegment[] {
            const parts = state.currentPath.split("/").filter(Boolean);
            let accPath = "";
            const base: BreadcrumbSegment[] = [{ label: "Root", path: "/" }];

            for (const part of parts) {
                accPath += "/" + part;
                base.push({ label: part, path: accPath });
            }

            return base;
        },

        workspaceStats(state): WorkspaceStat[] {
            const dirCount = state.currentEntries.filter((e) => e.kind === "folder").length;
            const fileCount = state.currentEntries.filter((e) => e.kind === "file").length;

            return [
                { label: "Directories", value: String(dirCount), helper: "Total directories", accent: "emerald" },
                { label: "Files", value: String(fileCount), helper: "Total files", accent: "cyan" },
            ];
        },

        activityFeed(): ActivityEntry[] {
            return [{ id: "fallback-1", title: "Real FS Loaded", summary: "Connected to Tauri backend.", timeLabel: "Now", tone: "success" }];
        },
    },

    // ── Actions ───────────────────────────────────────────────────────────────
    actions: {
        maxCombinedRightPanelWidth(): number {
            if (typeof window === "undefined") return MAX_RIGHT_PANEL * 2;
            return Math.max(MIN_RIGHT_PANEL * 2, window.innerWidth - NAV_WIDTH - MIN_MAIN_CONTENT);
        },

        setLeftSidebarWidth(next: number) {
            const cap = this.maxCombinedRightPanelWidth();
            let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

            if (this.aiChatOpen) {
                w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, this.aiChatPanelWidth));
                w = Math.max(MIN_RIGHT_PANEL, w);
            } else {
                w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
            }

            this.leftSidebarWidth = w;
        },

        resetLeftSidebarWidth() {
            this.leftSidebarWidth = DEFAULT_LEFT_SIDEBAR_WIDTH;
            this.reconcileRightPanelWidths();
        },

        setDetailsPanelWidth(next: number) {
            const cap = this.maxCombinedRightPanelWidth();
            let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

            if (this.aiChatOpen) {
                w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, this.aiChatPanelWidth));
                w = Math.max(MIN_RIGHT_PANEL, w);
            } else {
                w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
            }

            this.detailsPanelWidth = w;
        },

        setAiChatPanelWidth(next: number) {
            const cap = this.maxCombinedRightPanelWidth();
            let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

            if (this.detailsOpen) {
                w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, this.detailsPanelWidth));
                w = Math.max(MIN_RIGHT_PANEL, w);
            } else {
                w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
            }

            this.aiChatPanelWidth = w;
        },

        reconcileRightPanelWidths() {
            if (!this.detailsOpen && !this.aiChatOpen) return;

            if (this.leftSidebarOpen) this.setLeftSidebarWidth(this.leftSidebarWidth);
            if (this.detailsOpen) this.setDetailsPanelWidth(this.detailsPanelWidth);
            if (this.aiChatOpen) this.setAiChatPanelWidth(this.aiChatPanelWidth);

            if (this.detailsOpen && this.aiChatOpen) {
                const cap = this.maxCombinedRightPanelWidth();
                const sum = this.detailsPanelWidth + this.aiChatPanelWidth;

                if (sum > cap) {
                    let over = sum - cap;
                    const nextAi = Math.max(MIN_RIGHT_PANEL, this.aiChatPanelWidth - over);
                    over -= this.aiChatPanelWidth - nextAi;
                    this.aiChatPanelWidth = nextAi;
                    if (over > 0) {
                        this.detailsPanelWidth = Math.max(MIN_RIGHT_PANEL, this.detailsPanelWidth - over);
                    }
                }
            }
        },

        resetDetailsPanelWidth() {
            this.detailsPanelWidth = DEFAULT_DETAILS_PANEL_WIDTH;
            this.reconcileRightPanelWidths();
        },

        resetAiChatPanelWidth() {
            this.aiChatPanelWidth = DEFAULT_AI_CHAT_PANEL_WIDTH;
            this.reconcileRightPanelWidths();
        },

        setStatusBarHeight(next: number) {
            const h = Math.round(Math.min(MAX_STATUS_BAR_HEIGHT, Math.max(MIN_STATUS_BAR_HEIGHT, next)));
            this.statusBarHeight = h;
        },

        resetStatusBarHeight() {
            this.statusBarHeight = DEFAULT_STATUS_BAR_HEIGHT;
        },

        toggleDetails() {
            this.detailsOpen = !this.detailsOpen;
            this.reconcileRightPanelWidths();
        },

        toggleAiChat() {
            this.aiChatOpen = !this.aiChatOpen;
            this.reconcileRightPanelWidths();
        },
        async initializeHomeDir() {
            const home = await initHomeDirFromStorage();
            this.homePath = home;
            this.windowTabs = createInitialTabs(home);
            this.activeTabId = this.windowTabs[0]?.id ?? "";
            this.navigationGroups = createNavigationGroups(home);

            if (this.currentPath === "/root" || this.currentPath === "/") {
                this.openSection(home);
            }
            this.isInitialized = true;
        },

        async fetchItemMetadata(filePath: string | null | undefined) {
            console.log("[FileManagerStore] fetchItemMetadata started for:", filePath);
            if (!filePath) {
                this.selectedItemPermissions = null;
                this.selectedItemMediaInfo = null;
                return;
            }
            try {
                const permsPromise = getFilePermissions(filePath).catch((err) => {
                    console.error("[FileManagerStore] getFilePermissions error:", err);
                    return null;
                });
                const mediaPromise = getMediaInfo(filePath).catch((err) => {
                    console.error("[FileManagerStore] getMediaInfo error:", err);
                    return null;
                });
                const [perms, media] = await Promise.all([permsPromise, mediaPromise]);
                console.log("[FileManagerStore] fetchItemMetadata finished for:", filePath, "perms:", perms, "media:", media);
                this.selectedItemPermissions = perms;
                this.selectedItemMediaInfo = media;
            } catch (err) {
                console.error("[FileManagerStore] Failed to fetch extended info:", err);
            }
        },

        async updateSelectedItemMetadata() {
            const firstId = this.selectedItemIds.values().next().value ?? this.selectedItem?.id;
            await this.fetchItemMetadata(firstId ?? null);
        },

        async fetchDirectory(path: string) {
            const prevPath = this.currentPath;
            const prevEntries = this.currentEntries;
            const decodedPath = decodeURIComponent(path);
            const normalizedPath = decodedPath === "/root" ? "/" : decodedPath;

            this.currentPath = normalizedPath;
            this.searchQuery = "";
            this.isLoading = true;
            this.navError = null;

            try {
                if (normalizedPath === "/trash") {
                    const info = await getTrashedItems();
                    this.currentEntries = info.files.map((meta) => mapTrashMetaToEntry(meta, "slate"));
                    this.updateSelectedItemMetadata();
                    return;
                }

                const res = await readDirectory(normalizedPath);

                this.currentEntries = res.files.map((file) => {
                    const parseTime = (t: unknown): string => {
                        if (t && typeof (t as { secs_since_epoch?: number }).secs_since_epoch === "number") {
                            return new Date((t as { secs_since_epoch: number }).secs_since_epoch * 1000).toISOString();
                        }
                        if (typeof t === "number") return new Date(t * 1000).toISOString();
                        return new Date().toISOString();
                    };

                    const modifiedAt = parseTime(file.last_modified);
                    const createdAt = parseTime(file.created);
                    const accessedAt = parseTime(file.last_accessed);
                    const id = file.file_path || `unknown-${Math.random()}`;
                    const lowerName = (file.basename || "").toLowerCase();
                    const ext = lowerName.split(".").pop() || "";

                    let category = "document";
                    if (file.is_dir) {
                        category = "folder";
                    } else if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) {
                        category = "video";
                    } else if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
                        category = "image";
                    } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
                        category = "archive";
                    } else if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) {
                        category = "audio";
                    } else if (["pdf"].includes(ext)) {
                        category = "pdf";
                    } else if (["js", "ts", "vue", "py", "rs", "cpp", "h", "html", "css", "json", "sh"].includes(ext)) {
                        category = "code";
                    }

                    const entry: FileEntry = {
                        id,
                        name: file.basename || "Unknown",
                        kind: file.is_dir ? "folder" : "file",
                        category,
                        typeLabel: file.file_type || (file.is_dir ? "Directory" : "File"),
                        sizeLabel: file.is_dir ? "" : formatBytes(file.size || 0),
                        sortSize: file.size || 0,
                        modifiedAt,
                        createdAt,
                        accessedAt,
                        readonly: file.readonly,
                        isHidden: file.is_hidden || (file.basename || "").startsWith("."),
                        preview: category === "image" ? convertFileSrc(id) : "",
                        status: "local",
                        accent: file.is_dir ? "sky" : "slate",
                        locationPath: [path, file.basename || ""],
                        tags: [],
                        collaborators: [],
                        pinned: false,
                        childCount: 0,
                    };

                    if (category === "video") {
                        getVideoThumbnail(id)
                            .then((thumbPath) => {
                                entry.preview = convertFileSrc(thumbPath);
                                entry.thumbnail = thumbPath;
                            })
                            .catch((err) => {
                                console.error(`Video thumbnail failed for ${file.basename}:`, err);
                            });
                    } else if (category === "image") {
                        getImageThumbnail(id)
                            .then((thumbPath) => {
                                entry.preview = convertFileSrc(thumbPath);
                                entry.thumbnail = thumbPath;
                            })
                            .catch((err) => {
                                console.error(`Image thumbnail failed for ${file.basename}:`, err);
                            });
                    }

                    return entry;
                });

                this.updateSelectedItemMetadata();
            } catch (error) {
                console.error("Failed to read directory:", error);

                this.currentPath = prevPath;
                this.currentEntries = prevEntries;

                const msg = String(error);
                const isPermission = /permission denied|access denied|eacces/i.test(msg);
                const isNotFound = /no such file|not found|enoent/i.test(msg);

                this.navError = {
                    kind: isPermission ? "permission" : isNotFound ? "not-found" : "unknown",
                    path,
                    message: msg,
                };
            } finally {
                this.isLoading = false;
            }
        },

        openSection(path: string) {
            const decodedPath = decodeURIComponent(path);
            this.currentPath = decodedPath;
            this.searchQuery = "";
            this.updateActiveTabPath(decodedPath);
            this.fetchDirectory(decodedPath);
        },

        refresh() {
            this.fetchDirectory(this.currentPath);
        },

        selectItem(itemId: string) {
            this.selectedItemIds = new Set([itemId]);
            this.updateSelectedItemMetadata();
        },

        setSelectedItems(itemIds: string[]) {
            this.selectedItemIds = new Set(itemIds);
            this.updateSelectedItemMetadata();
        },

        toggleItemSelection(itemId: string) {
            const next = new Set(this.selectedItemIds);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            this.selectedItemIds = next;
            this.updateSelectedItemMetadata();
        },

        selectAllItems() {
            this.selectedItemIds = new Set(this.sortedAndFilteredEntries.map((e: FileEntry) => e.id));
            this.updateSelectedItemMetadata();
        },

        clearSelection() {
            this.selectedItemIds = new Set();
            this.updateSelectedItemMetadata();
        },

        setSearchQuery(value: string) {
            this.searchQuery = value;
            this.updateSelectedItemMetadata();
        },

        setViewMode(nextMode: ViewMode) {
            this.viewMode = nextMode;
        },

        setSortMode(nextMode: SortMode) {
            this.sortMode = nextMode;
        },

        setShowHiddenFiles(nextValue: boolean) {
            this.showHiddenFiles = nextValue;
            this.clearSelection();
        },

        setShowMountPoints(nextValue: boolean) {
            this.showMountPoints = nextValue;
        },

        setHiddenFilesVisualStyle(nextValue: typeof this.hiddenFilesVisualStyle) {
            this.hiddenFilesVisualStyle = nextValue;
        },

        cycleSortMode() {
            const order: SortMode[] = ["modified", "name", "size", "kind"];
            const currentIndex = order.indexOf(this.sortMode);
            this.sortMode = order[(currentIndex + 1) % order.length] ?? "modified";
        },

        openSettings() {
            this.settingsOpen = true;
        },

        closeSettings() {
            this.settingsOpen = false;
        },

        toggleSettings() {
            this.settingsOpen = !this.settingsOpen;
        },

        async fetchDrives() {
            try {
                const res = await getDrives();
                this.driveCards = res.array_of_drives.map(mapDriveInfoToCard);
            } catch (e) {
                console.error("Failed to fetch drives:", e);
            }
        },

        async createDirectory(): Promise<string | null> {
            const base = "New Folder";
            let name = base;
            let counter = 1;

            while (await fileExist(`${this.currentPath}/${name}`)) {
                counter += 1;
                name = `${base} (${counter})`;
            }

            const newPath = `${this.currentPath}/${name}`;
            try {
                const ok = await createDirRecursive(newPath);
                if (!ok) {
                    console.error("[FileManagerStore] createDirectory: backend returned false for", newPath);
                    return null;
                }
                await this.fetchDirectory(this.currentPath);
                return newPath;
            } catch (e) {
                console.error("[FileManagerStore] createDirectory failed:", e);
                return null;
            }
        },

        isPinned(itemId: string): boolean {
            return this.currentEntries.find((e) => e.id === itemId)?.pinned ?? false;
        },

        togglePinnedForSelection() {
            const firstId = this.selectedItemIds.values().next().value;
            if (!firstId) return;
            const match = this.currentEntries.find((e) => e.id === firstId);
            if (match) match.pinned = !match.pinned;
        },

        getTabLabel(path: string) {
            if (path === defaultPath) return "Home";
            if (path === this.homePath) return "Home";
            if (path === "/trash") return "Trash";
            if (path === "/drives" || path === "/@drives") return "@drives";
            if (path === "/locations" || path === "/@locations") return "@locations";
            if (path === "/settings" || path === "/@settings") return "@settings";
            return (path + "").split("/").filter(Boolean).pop() || "New Tab";
        },

        updateTabPath(tabId: string, path: string) {
            const decodedPath = decodeURIComponent(path);
            const idx = this.windowTabs.findIndex((t) => t.id === tabId);
            if (idx === -1) return;
            const resolvedPath = decodedPath && decodedPath.startsWith("@") ? (decodedPath === "@drives" ? "/drives" : decodedPath) : decodedPath;
            const tab = this.windowTabs[idx];
            if (tab) {
                tab.path = resolvedPath;
                tab.sectionId = resolvedPath;
                tab.subtitle = resolvedPath;
                tab.label = this.getTabLabel(decodedPath);
            }
        },

        updateActiveTabPath(path: string) {
            if (!this.activeTabId) return;
            this.updateTabPath(this.activeTabId, path);
        },

        setActiveTab(tabId: string) {
            if (!this.windowTabs.find((t) => t.id === tabId)) return;
            this.activeTabId = tabId;
        },

        addTab(path: string = defaultPath) {
            if (!this.activeTabId && this.windowTabs[0]) {
                this.activeTabId = this.windowTabs[0].id;
            }
            const decodedPath = decodeURIComponent(path);
            const id = `tab-${Date.now()}`;
            const resolvedPath = decodedPath && decodedPath.startsWith("@") ? (decodedPath === "@drives" ? "/drives" : decodedPath) : decodedPath;
            const label = this.getTabLabel(decodedPath);
            this.windowTabs.push({ id, label, path: resolvedPath, sectionId: resolvedPath, subtitle: resolvedPath });
            this.activeTabId = id;
            return id;
        },

        closeTab(tabId: string) {
            if (this.windowTabs.length <= 1) return;
            const idx = this.windowTabs.findIndex((t) => t.id === tabId);
            if (idx === -1) return;
            const wasActive = this.activeTabId === tabId;
            this.windowTabs.splice(idx, 1);
            if (wasActive) {
                const next = this.windowTabs[Math.max(0, idx - 1)];
                if (next) this.activeTabId = next.id;
            }
        },

        reorderTabs(fromIndex: number, toIndex: number) {
            if (fromIndex === toIndex) return;
            if (fromIndex < 0 || fromIndex >= this.windowTabs.length) return;
            if (toIndex < 0 || toIndex >= this.windowTabs.length) return;

            const tab = this.windowTabs[fromIndex];
            if (!tab) return;
            this.windowTabs.splice(fromIndex, 1);
            this.windowTabs.splice(toIndex, 0, tab);
        },

        async openItem(filePath: string) {
            try {
                if (await isDir(filePath)) {
                    this.openSection(filePath);
                } else {
                    await openFile(filePath);
                }
            } catch (e) {
                console.error("Failed to open item:", e);
            }
        },

        async deleteSelection() {
            if (this.selectedItemIds.size === 0) return false;
            try {
                const paths = Array.from(this.selectedItemIds);
                const success = await deleteFile(paths);
                if (success) {
                    this.selectedItemIds.clear();
                    await this.fetchDirectory(this.currentPath);
                }
                return success;
            } catch (e) {
                console.error("Failed to delete selection:", e);
                return false;
            }
        },

        async openInTerminal(path: string) {
            try {
                await tauriOpenTerminal(path);
            } catch (e) {
                console.error("Failed to open terminal:", e);
            }
        },

        async renameItem(oldPath: string, newName: string) {
            try {
                const parentDir = oldPath.substring(0, oldPath.lastIndexOf("/") + 1);
                const newPath = parentDir + newName;
                const success = await tauriMove(oldPath, newPath);
                if (success) await this.fetchDirectory(this.currentPath);
                return success;
            } catch (e) {
                console.error("Failed to rename item:", e);
                return false;
            }
        },

        async batchRename(renames: Array<{ oldPath: string; newName: string }>) {
            try {
                for (const { oldPath, newName } of renames) {
                    const parentDir = oldPath.substring(0, oldPath.lastIndexOf("/") + 1);
                    const newPath = parentDir + newName;
                    const success = await tauriMove(oldPath, newPath);
                    if (!success) {
                        console.error(`Failed to rename ${oldPath} to ${newName}`);
                        return false;
                    }
                }
                await this.fetchDirectory(this.currentPath);
                return true;
            } catch (e) {
                console.error("Failed to batch rename:", e);
                return false;
            }
        },

        setClipboard(paths: string[], mode: "copy" | "cut") {
            this.clipboard = { paths, mode };
        },

        async paste() {
            if (!this.clipboard.paths.length || !this.clipboard.mode) return;
            try {
                for (const src of this.clipboard.paths) {
                    const name = src.split("/").pop() || "";
                    const dest = this.currentPath.endsWith("/") ? this.currentPath + name : this.currentPath + "/" + name;

                    if (this.clipboard.mode === "copy") {
                        await tauriCopy(src, dest);
                    } else {
                        await tauriMove(src, dest);
                    }
                }
                if (this.clipboard.mode === "cut") this.clipboard = { paths: [], mode: null };
                await this.fetchDirectory(this.currentPath);
            } catch (e) {
                console.error("Paste failed:", e);
            }
        },

        setExpandedPreviewId(id: string | null) {
            this.expandedPreviewId = id;
        },

        async saveFileContent(path: string, content: string) {
            try {
                const success = await writeTextFile(path, content);
                if (success) return true;
                return false;
            } catch (e) {
                console.error("Failed to save file content:", e);
                return false;
            }
        },
    },
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useFileManagerStore, import.meta.hot));
}
