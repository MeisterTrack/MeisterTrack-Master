import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base

# 모든 모델을 Base.metadata에 등록 (alembic/env.py와 동일한 이유)
from app.features.ai_review import models as ai_review_models  # noqa: F401
from app.features.approvals import models as approvals_models  # noqa: F401
from app.features.audit_log import models as audit_log_models  # noqa: F401
from app.features.auth import models as auth_models  # noqa: F401
from app.features.scoring import models as scoring_models  # noqa: F401
from app.features.submissions import models as submissions_models  # noqa: F401


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
