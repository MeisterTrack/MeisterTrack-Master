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
    allowed_email_domain: str = "bssm.hs.kr"
    google_oauth_mock: bool = True  # 실제 Google OAuth 클라이언트 발급 전까지 mock 로그인 사용
    google_client_id: str = ""
    google_client_secret: str = ""

    # AI (NVIDIA NIM, OpenAI-compatible)
    nvidia_api_key: str = ""
    nvidia_api_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model_name: str = "nvidia/nvidia-nemotron-nano-9b-v2"

    # scoring config
    grade_deadline_underclassman: str = "12-31"  # 1, 2학년
    grade_deadline_senior: str = "06-30"  # 3학년

    # file storage
    upload_dir: str = "uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10MB


@lru_cache
def get_settings() -> Settings:
    return Settings()
