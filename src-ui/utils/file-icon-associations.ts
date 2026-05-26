import { fileIcons } from "@/file-associations/src/core/icons/fileIcons";

interface FileIconAssociation {
    name: string;
    fileExtensions?: string[] | undefined;
    fileNames?: string[] | undefined;
    disabled?: boolean | undefined;
}

interface ResolveFileIconInput {
    fileName: string;
    filePath?: string | undefined;
}

const iconLoaders = import.meta.glob("/src-ui/file-associations/icons/*.svg", {
    import: "default",
    query: "?url",
}) as Record<string, () => Promise<string>>;

const iconUrlLoaders = new Map<string, () => Promise<string>>(
    Object.entries(iconLoaders).map(([path, loader]) => {
        const iconFileName = path.split("/").pop() ?? "";
        return [iconFileName.replace(/\.svg$/, ""), loader];
    }),
);

const enabledFileIcons = fileIcons.icons.filter((icon) => !icon.disabled) as FileIconAssociation[];

const fileNameAssociations = enabledFileIcons
    .flatMap((icon) =>
        (icon.fileNames ?? []).map((fileName) => ({
            fileName: fileName.toLowerCase(),
            iconName: icon.name,
        })),
    )
    .sort((a, b) => b.fileName.length - a.fileName.length);

const extensionAssociations = enabledFileIcons
    .flatMap((icon) =>
        (icon.fileExtensions ?? []).map((extension) => ({
            extension: extension.toLowerCase().replace(/^\./, ""),
            iconName: icon.name,
        })),
    )
    .sort((a, b) => b.extension.length - a.extension.length);

const defaultIconName = fileIcons.defaultIcon.name;

function normalizePath(path: string): string {
    return path.replaceAll("\\", "/").toLowerCase();
}

function getBaseName(fileName: string, filePath?: string): string {
    const source = fileName || filePath || "";
    return normalizePath(source).split("/").pop() ?? source.toLowerCase();
}

async function resolveIconUrl(iconName: string): Promise<string> {
    const loader = iconUrlLoaders.get(iconName) ?? iconUrlLoaders.get(defaultIconName);
    return loader ? await loader() : "";
}

export function resolveFileIconName({ fileName, filePath }: ResolveFileIconInput): string {
    const baseName = getBaseName(fileName, filePath);
    const normalizedPath = filePath ? normalizePath(filePath) : baseName;

    const fileNameMatch = fileNameAssociations.find(
        (association) => baseName === association.fileName || normalizedPath.endsWith(`/${association.fileName}`),
    );
    if (fileNameMatch) return fileNameMatch.iconName;

    const extensionMatch = extensionAssociations.find(
        (association) => baseName === association.extension || baseName.endsWith(`.${association.extension}`),
    );

    return extensionMatch?.iconName ?? defaultIconName;
}

export async function resolveFileIconUrl(input: ResolveFileIconInput): Promise<string> {
    return await resolveIconUrl(resolveFileIconName(input));
}
