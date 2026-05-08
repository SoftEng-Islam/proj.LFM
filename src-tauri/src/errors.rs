use thiserror::Error;

#[derive(Error, Debug)]
#[allow(dead_code)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Operation failed: {0}")]
    Operation(String),
}

pub type AppResult<T> = Result<T, AppError>;
