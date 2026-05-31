import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../src-tauri/lib");
const platform = process.platform;
const arch = process.arch === "x64" ? "x86_64" : process.arch === "arm64" ? "aarch64" : process.arch;

const assetMap = {
    linux: `libmpv-wrapper-linux-${arch}.zip`,
    darwin: `libmpv-wrapper-macos-${arch}.zip`,
    win32: `libmpv-wrapper-windows-${arch}.zip`,
};

if (!assetMap[platform]) {
    console.error(`Unsupported platform: ${platform}. Only linux/darwin/win32 are supported.`);
    process.exit(1);
}

const archiveName = assetMap[platform];
const downloadUrl = `https://github.com/nini22P/libmpv-wrapper/releases/latest/download/${archiveName}`;
const archivePath = resolve(outDir, archiveName);

function runCommand(command, args) {
    const result = spawnSync(command, args, { stdio: "inherit" });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`Command failed: ${command} ${args.join(" ")}`);
    }
}

function findDownloader() {
    try {
        runCommand("which", ["curl"]);
        return "curl";
    } catch {
        try {
            runCommand("which", ["wget"]);
            return "wget";
        } catch {
            return null;
        }
    }
}

function hasUnzip() {
    try {
        runCommand("which", ["unzip"]);
        return true;
    } catch {
        return false;
    }
}

function ensureDirectory(path) {
    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }
}

try {
    ensureDirectory(outDir);

    if (
        existsSync(join(outDir, platform === "linux" ? "libmpv-wrapper.so" : platform === "darwin" ? "libmpv-wrapper.dylib" : "libmpv-wrapper.dll"))
    ) {
        console.log("libmpv-wrapper already exists in src-tauri/lib. No download needed.");
        process.exit(0);
    }

    const downloader = findDownloader();
    if (!downloader) {
        console.error("Neither curl nor wget is installed. Please install one of these tools and re-run this script.");
        process.exit(1);
    }

    if (!hasUnzip()) {
        console.error("The unzip utility is required to extract the downloaded archive. Please install unzip and re-run this script.");
        process.exit(1);
    }

    console.log(`Downloading ${downloadUrl}`);
    if (downloader === "curl") {
        runCommand("curl", ["-L", "-o", archivePath, downloadUrl]);
    } else {
        runCommand("wget", ["-O", archivePath, downloadUrl]);
    }

    console.log(`Extracting ${archiveName} into src-tauri/lib`);
    runCommand("unzip", ["-j", archivePath, "-d", outDir]);
    rmSync(archivePath, { force: true });

    console.log("libmpv-wrapper downloaded and extracted to src-tauri/lib.");
} catch (error) {
    console.error("Failed to download libmpv-wrapper:", error instanceof Error ? error.message : error);
    process.exit(1);
}
