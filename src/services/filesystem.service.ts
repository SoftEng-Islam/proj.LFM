import { invoke } from '@tauri-apps/api/core';

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
}

export async function readDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('read_directory', { path });
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
  return invoke<boolean>('file_exist', { filePath: path });
}
