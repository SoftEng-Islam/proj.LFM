use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref MEDIA_PORT: Mutex<u16> = Mutex::new(0);
}

pub async fn start_media_server() {
    let app = Router::new()
        .nest_service("/media", tower_http::services::ServeDir::new("/"))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    // Bind to any available port on localhost
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("Failed to bind media server");
    let port = listener.local_addr().unwrap().port();
    
    // Store the port so we can expose it to the frontend via a Tauri command
    *MEDIA_PORT.lock().unwrap() = port;

    tokio::spawn(async move {
        axum::serve(listener, app).await.expect("Media server failed");
    });
}

#[tauri::command]
pub fn get_media_server_port() -> u16 {
    *MEDIA_PORT.lock().unwrap()
}
