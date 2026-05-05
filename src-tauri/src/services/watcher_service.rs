use notify::{watcher, DebouncedEvent, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::Duration;

pub fn watch_directory<F>(
    path: String,
    mut callback: F,
) -> notify::Result<RecommendedWatcher>
where
    F: FnMut(notify::Result<DebouncedEvent>) + Send + 'static,
{
    let (tx, rx) = channel();

    let mut watcher = watcher(tx, Duration::from_millis(250))?;

    watcher.watch(Path::new(&path), RecursiveMode::NonRecursive)?;

    std::thread::spawn(move || {
        for event in rx {
            callback(Ok(event));
        }
    });

    Ok(watcher)
}
