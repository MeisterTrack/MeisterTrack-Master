from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.features.auth.models import User


def authenticate(db: Session, login_id: str, password: str) -> User | None:
    user = db.query(User).filter(User.login_id == login_id).first()
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


def issue_token_for(user: User) -> str:
    return create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})
