from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.db.base import Base

# 모델을 Base.metadata에 등록하기 위해 import (실제 사용은 안 하지만 필요)
from app.features.auth import models as auth_models  # noqa: F401
from app.features.submissions import models as submissions_models  # noqa: F401
from app.features.scoring import models as scoring_models  # noqa: F401
from app.features.ai_review import models as ai_review_models  # noqa: F401
from app.features.audit_log import models as audit_log_models  # noqa: F401
from app.features.approvals import models as approvals_models  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", get_settings().database_url)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
