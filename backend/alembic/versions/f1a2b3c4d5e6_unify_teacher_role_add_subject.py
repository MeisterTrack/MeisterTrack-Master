"""unify homeroom/area teacher role into single teacher role, add subject column

Revision ID: f1a2b3c4d5e6
Revises: c9dee6061ff0
Create Date: 2026-07-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'c9dee6061ff0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 담임/영역담당 구분이던 role을 단일 TEACHER로 통합 (담임 여부는 grade/class_no 값으로 판단, 겸직 가능)
    # MySQL ENUM은 기존 값을 담을 새 값을 먼저 허용해야 UPDATE가 가능하므로 확장 -> 데이터 이관 -> 축소 순서로 진행
    op.alter_column(
        'users',
        'role',
        existing_type=sa.Enum('STUDENT', 'HOMEROOM_TEACHER', 'AREA_TEACHER', 'ADMIN', name='role'),
        type_=sa.Enum('STUDENT', 'HOMEROOM_TEACHER', 'AREA_TEACHER', 'TEACHER', 'ADMIN', name='role'),
        existing_nullable=False,
    )
    op.execute("UPDATE users SET role='TEACHER' WHERE role IN ('HOMEROOM_TEACHER', 'AREA_TEACHER')")
    op.alter_column(
        'users',
        'role',
        existing_type=sa.Enum('STUDENT', 'HOMEROOM_TEACHER', 'AREA_TEACHER', 'TEACHER', 'ADMIN', name='role'),
        type_=sa.Enum('STUDENT', 'TEACHER', 'ADMIN', name='role'),
        existing_nullable=False,
    )
    # department는 이제 순수 '부서'만 의미 — 예전 담임 전용 표식이던 값은 비운다 (담임 여부는 grade/class_no로 판단)
    op.execute("UPDATE users SET department=NULL WHERE department='담임교사'")
    op.add_column('users', sa.Column('subject', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # 담임/영역담당 구분이 사라졌으므로 되돌릴 때는 전부 AREA_TEACHER로 되돌린다 (원래 구분 정보는 복원 불가)
    op.drop_column('users', 'subject')
    op.alter_column(
        'users',
        'role',
        existing_type=sa.Enum('STUDENT', 'TEACHER', 'ADMIN', name='role'),
        type_=sa.Enum('STUDENT', 'HOMEROOM_TEACHER', 'AREA_TEACHER', 'TEACHER', 'ADMIN', name='role'),
        existing_nullable=False,
    )
    op.execute("UPDATE users SET role='AREA_TEACHER' WHERE role='TEACHER'")
    op.alter_column(
        'users',
        'role',
        existing_type=sa.Enum('STUDENT', 'HOMEROOM_TEACHER', 'AREA_TEACHER', 'TEACHER', 'ADMIN', name='role'),
        type_=sa.Enum('STUDENT', 'HOMEROOM_TEACHER', 'AREA_TEACHER', 'ADMIN', name='role'),
        existing_nullable=False,
    )
