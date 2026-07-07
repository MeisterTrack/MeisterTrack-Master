import uuid
from pathlib import Path

from fastapi import UploadFile

from app.common.exceptions import InvalidStateError
from app.core.config import get_settings

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}


def save_submission_file(student_id: int, file: UploadFile) -> str:
    settings = get_settings()

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidStateError(f"허용되지 않은 파일 형식입니다: {ext or '(확장자 없음)'}")

    content = file.file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise InvalidStateError("파일 용량이 너무 큽니다.")

    student_dir = Path(settings.upload_dir) / str(student_id)
    student_dir.mkdir(parents=True, exist_ok=True)

    dest_path = student_dir / f"{uuid.uuid4().hex}{ext}"
    dest_path.write_bytes(content)

    return str(dest_path)
