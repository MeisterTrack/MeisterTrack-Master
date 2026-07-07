from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # app
    app_name: str = "MeisterTrack"
    environment: str = "development"

    # db
    database_url: str = "mysql+pymysql://meistertrack:meistertrack@localhost:3306/meistertrack"

    # auth
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 12

    # AI (NVIDIA NIM, OpenAI-compatible)
    nvidia_api_key: str = ""
    nvidia_api_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model_name: str = "meta/llama-3.1-70b-instruct"

    # scoring config
    grade_deadline_underclassman: str = "12-31"  # 1, 2학년
    grade_deadline_senior: str = "06-30"  # 3학년

    # file storage
    upload_dir: str = "uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10MB


@lru_cache
def get_settings() -> Settings:
    return Settings()
