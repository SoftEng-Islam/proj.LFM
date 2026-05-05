use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;

pub fn watch_directory<F>(path: String, mut callback: F) -> notify::Result<RecommendedWatcher>
where
    F: FnMut(notify::Result<Event>) + Send + 'static,
{
    let (tx, rx) = channel();

    let mut watcher = RecommendedWatcher::new(
        move |result| {
            let _ = tx.send(result);
        },
        Config::default(),
    )?;

    watcher.watch(Path::new(&path), RecursiveMode::NonRecursive)?;

    std::thread::spawn(move || {
        for result in rx {
            callback(result);
        }
    });

    Ok(watcher)
}
