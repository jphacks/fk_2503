from pydantic import BaseModel
import os


class Settings(BaseModel):
    env: str = os.getenv("ENV", "development")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    # External APIs
    tripo_api_key: str | None = os.getenv("TRIPO_API_KEY")
    tripo_api_base: str = os.getenv("TRIPO_API_BASE", "")
    tripo_create_path: str = os.getenv("TRIPO_ITD_CREATE_PATH", "")
    tripo_status_path: str = os.getenv("TRIPO_ITD_STATUS_PATH", "")  # may include {task_id}
    tripo_poll_interval: float = float(os.getenv("TRIPO_POLL_INTERVAL", "2.0"))
    tripo_poll_timeout: float = float(os.getenv("TRIPO_POLL_TIMEOUT", "120.0"))

    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
    # Prefer 2.x line if available; can be overridden via env.
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    # Whether to request structured JSON via response_schema (can be incompatible depending on SDK/version)
    gemini_use_schema: bool = os.getenv("GEMINI_USE_SCHEMA", "0").lower() in ("1", "true")

    # Development helpers
    mock_external: bool = os.getenv("MOCK_EXTERNAL", "0") in ("1", "true", "True")
    mock_gemini: bool = os.getenv("MOCK_GEMINI", "").lower() in ("1", "true") or (
        os.getenv("MOCK_GEMINI") is None and (os.getenv("MOCK_EXTERNAL", "0").lower() in ("1", "true"))
    )
    mock_tripo: bool = os.getenv("MOCK_TRIPO", "").lower() in ("1", "true") or (
        os.getenv("MOCK_TRIPO") is None and (os.getenv("MOCK_EXTERNAL", "0").lower() in ("1", "true"))
    )


settings = Settings()
