interface ResolveFileIconInput {
    fileName: string;
    filePath?: string | undefined;
}

const DEFAULT_ICON_NAME = "default";

function normalizePath(path: string): string {
    return path.replaceAll("\\", "/").toLowerCase();
}

function getBaseName(fileName: string, filePath?: string): string {
    const source = fileName || filePath || "";
    return normalizePath(source).split("/").pop() ?? source.toLowerCase();
}

export function resolveFileIconName({ fileName, filePath }: ResolveFileIconInput): string {
    const baseName = getBaseName(fileName, filePath);
    if (!baseName) return DEFAULT_ICON_NAME;

    const ext = baseName.split(".").pop() ?? "";
    const knownExtensions = new Set(["js", "ts", "json", "md", "html", "css", "yaml", "yml", "env", "sh", "png", "jpg", "jpeg", "svg", "zip", "exe"]);

    if (knownExtensions.has(ext)) {
        return ext;
    }

    return DEFAULT_ICON_NAME;
}

export async function resolveFileIconUrl(_input: ResolveFileIconInput): Promise<string> {
    return "";
}
