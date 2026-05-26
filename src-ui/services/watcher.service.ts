import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface FilesystemWatchEvent {
  path: string;
  event: string;
}

export async function listenFilesystemChanges(
  callback: (event: FilesystemWatchEvent) => void,
): Promise<UnlistenFn> {
  return listen<FilesystemWatchEvent>('filesystem://changed', (event) => {
    callback(event.payload);
  });
}
