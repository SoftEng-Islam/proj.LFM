import { invoke } from '@tauri-apps/api/core';

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  fileType?: string;
  hidden?: boolean;
}

interface BackendFile {
  basename: string;
  file_path: string;
  is_dir: boolean;
  size: number;
  file_type: string;
  is_hidden: boolean;
}

interface ReadDirectoryResponse {
  files: BackendFile[];
}

export async function readDirectory(path: string): Promise<FileEntry[]> {
  const response = await invoke<ReadDirectoryResponse>('read_directory', {
    dir: path,
  });

  return response.files.map((file) => ({
    name: file.basename,
    path: file.file_path,
    isDir: file.is_dir,
    size: file.size,
    fileType: file.file_type,
    hidden: file.is_hidden,
  }));
}

export async function copyFile(src: string, dest: string): Promise<boolean> {
  return invoke<boolean>('copy', { src, dest });
}

export async function renameFile(path: string, newPath: string): Promise<boolean> {
  return invoke<boolean>('rename', {
    path,
    newPath,
  });
}

export async function removeFile(path: string): Promise<boolean> {
  return invoke<boolean>('remove_file', { path });
}

export async function removeDirectory(path: string): Promise<boolean> {
  return invoke<boolean>('remove_dir', { path });
}

export async function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>('file_exist', {
    filePath: path,
  });
}

export async function openFile(path: string): Promise<boolean> {
  return invoke<boolean>('open_file', {
    filePath: path,
  });
}

export async function watchDirectory(path: string): Promise<void> {
  return invoke('watch_directory', {
    path,
  });
}
