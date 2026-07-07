import time
from collections.abc import Callable
from typing import TypeVar

from openai import APIStatusError, OpenAI

from app.core.config import get_settings

_client: OpenAI | None = None

T = TypeVar("T")


def call_with_retry(fn: Callable[[], T], max_attempts: int = 3, backoff_seconds: float = 2.0) -> T:
    """무료 티어 레이트리밋(429) 대응. 지수 백오프로 재시도한다."""
    last_error: Exception | None = None
    for attempt in range(max_attempts):
        try:
            return fn()
        except APIStatusError as exc:
            last_error = exc
            if exc.status_code != 429 or attempt == max_attempts - 1:
                raise
            time.sleep(backoff_seconds * (2**attempt))
    raise last_error  # pragma: no cover


def is_ai_enabled() -> bool:
    """NVIDIA_API_KEY 미발급 상태에서는 실제 호출 대신 mock 경로로 동작시킨다."""
    return bool(get_settings().nvidia_api_key)


def get_nvidia_client() -> OpenAI:
    """NVIDIA NIM OpenAI 호환 엔드포인트 클라이언트.

    모델은 대회 기간 중 일관성/재현성을 위해 config에 고정된 값만 사용한다(임의 스위칭 금지).
    무료 티어 레이트리밋 대응을 위해 호출부(ocr_service/similarity_service)에서 재시도 로직을 반드시 포함해야 한다.
    """
    global _client
    if _client is None:
        settings = get_settings()
        _client = OpenAI(base_url=settings.nvidia_api_base_url, api_key=settings.nvidia_api_key)
    return _client
