// Central file-icon registry helpers.
// Returns a logical icon key (string) that the UI's icon component can map to an actual icon.

const extensionMap: Record<string, string> = {
    // common
    js: "file-js",
    ts: "file-ts",
    json: "file-json",
    md: "file-markdown",
    html: "file-html",
    mhtml: "file-html",
    css: "file-css",
    yaml: "file-yaml",
    yml: "file-yaml",
    env: "file-env",
    envrc: "file-env",
    sh: "file-shell",
    png: "file-image",
    jpg: "file-image",
    jpeg: "file-image",
    svg: "file-svg",
    zip: "file-zip",
    exe: "file-binary",
    // add as-needed
};

export function getIconKeyForFilename(name: string): string {
    const idx = name.lastIndexOf(".");
    if (idx === -1) return "file";
    const ext = name.slice(idx + 1).toLowerCase();
    return extensionMap[ext] || "file";
}

export function registerExtension(ext: string, key: string) {
    extensionMap[ext.replace(/^[.]/, "").toLowerCase()] = key;
}

export function getDriveIconKey(type?: string): string {
    if (!type) return "drive";
    const t = type.toLowerCase();
    if (t.includes("removable")) return "drive-usb";
    if (t.includes("ssd")) return "drive-ssd";
    if (t.includes("hdd")) return "drive-hdd";
    return "drive";
}

export default { getIconKeyForFilename, registerExtension, getDriveIconKey };
