from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.security import decode_access_token
from app.db.session import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_claims(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        return decode_access_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 정보가 유효하지 않습니다.",
        ) from exc


def require_role(*allowed_roles: Role):
    def _checker(claims: dict = Depends(get_current_user_claims)) -> dict:
        if claims.get("role") not in {role.value for role in allowed_roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")
        return claims

    return _checker
