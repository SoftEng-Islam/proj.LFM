use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Invalid path")]
    InvalidPath,

    #[error("Operation failed: {0}")]
    Operation(String),
}

pub type AppResult<T> = Result<T, AppError>;
