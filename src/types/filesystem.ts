export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
}

export interface DirectoryState {
  currentPath: string;
  files: FileEntry[];
  loading: boolean;
  error?: string | null;
}
