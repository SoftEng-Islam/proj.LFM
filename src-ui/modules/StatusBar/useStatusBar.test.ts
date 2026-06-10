import { describe, expect, it, beforeEach } from "vitest";
import { useStatusBar } from "./useStatusBar.ts";

describe("useStatusBar", () => {
    const statusBar = useStatusBar();

    beforeEach(() => {
        statusBar.openPanel("terminal");
        statusBar.closePanel();
    });

    it("opens the requested panel tab", () => {
        statusBar.openPanel("git");

        expect(statusBar.panelOpen.value).toBe(true);
        expect(statusBar.activeTab.value).toBe("git");
        expect(statusBar.activePanelTab.value).toBe("git");
    });

    it("closes when toggling the currently open tab", () => {
        statusBar.openPanel("terminal");
        statusBar.togglePanel("terminal");

        expect(statusBar.panelOpen.value).toBe(false);
        expect(statusBar.activeTab.value).toBe("terminal");
        expect(statusBar.activePanelTab.value).toBeNull();
    });

    it("switches tabs without closing when another tab is toggled", () => {
        statusBar.openPanel("terminal");
        statusBar.togglePanel("log");

        expect(statusBar.panelOpen.value).toBe(true);
        expect(statusBar.activeTab.value).toBe("log");
        expect(statusBar.activePanelTab.value).toBe("log");
    });
});
