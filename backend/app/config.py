import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"
    JWT_SECRET: str = "change-me"
    DATABASE_URL: str = "sqlite:///./trace.db"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 20
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
