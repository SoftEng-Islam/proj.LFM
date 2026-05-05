use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;

pub fn watch_directory<F>(path: String, callback: F) -> notify::Result<RecommendedWatcher>
where
    F: FnMut(notify::Result<notify::Event>) + Send + 'static,
{
    let (tx, rx) = channel();

    let mut watcher = notify::recommended_watcher(move |result| {
        let _ = tx.send(result);
    })?;

    watcher.watch(Path::new(&path), RecursiveMode::NonRecursive)?;

    std::thread::spawn(move || {
        for result in rx {
            callback(result);
        }
    });

    Ok(watcher)
}
