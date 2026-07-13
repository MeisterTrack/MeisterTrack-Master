from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Role
from app.common.exceptions import InvalidStateError, NotFoundError, PermissionDeniedError
from app.core.config import get_settings
from app.core.security import create_access_token
from app.features.auth.models import User
from app.features.auth.schemas import OnboardingRequest

# 온보딩에서 교사가 선택하는 담당 부서 -> 실제 담당 영역 매핑 (F-6, 운영계획서 II장 입력담당 기준)
DEPARTMENT_DOMAIN_MAP: dict[str, Domain] = {
    "산학협력부": Domain.TECHNICAL_COMPETENCY,
    "전문교육부": Domain.TECHNICAL_COMPETENCY,
    "체육교사": Domain.CHARACTER_WORK_ETHIC,
    "영어교과": Domain.FOREIGN_LANGUAGE,
    "국어교과": Domain.HUMANITIES_LITERACY,
}
HOMEROOM_DEPARTMENT = "담임교사"
TEACHER_DEPARTMENTS = [HOMEROOM_DEPARTMENT, *DEPARTMENT_DOMAIN_MAP.keys()]


def assert_allowed_domain(email: str) -> None:
    settings = get_settings()
    domain = email.rsplit("@", 1)[-1].lower()
    if domain != settings.allowed_email_domain.lower():
        raise PermissionDeniedError(f"{settings.allowed_email_domain} 학교 계정만 로그인할 수 있습니다.")


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def issue_token_for(user: User) -> str:
    return create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})


def create_onboarding_user(db: Session, payload: OnboardingRequest) -> User:
    assert_allowed_domain(payload.email)
    if find_user_by_email(db, payload.email) is not None:
        raise InvalidStateError("이미 가입된 계정입니다.")

    if payload.role == "student":
        user = User(
            email=payload.email,
            name=payload.name,
            role=Role.STUDENT,
            grade=payload.grade,
            class_no=payload.class_no,
            student_no=payload.student_no,
            approval_status=ApprovalStatus.PENDING,
        )
    else:
        if payload.department not in TEACHER_DEPARTMENTS:
            raise InvalidStateError("담당 교과/부서를 올바르게 선택해주세요.")
        role = Role.HOMEROOM_TEACHER if payload.department == HOMEROOM_DEPARTMENT else Role.AREA_TEACHER
        user = User(
            email=payload.email,
            name=payload.name,
            role=role,
            grade=payload.grade if payload.department == HOMEROOM_DEPARTMENT else None,
            class_no=payload.class_no if payload.department == HOMEROOM_DEPARTMENT else None,
            department=payload.department,
            approval_status=ApprovalStatus.PENDING,
        )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_pending_onboarding(db: Session, reviewer: User) -> list[User]:
    """담임교사는 본인 학급 학생을, 관리자는 대기 중인 교사 계정을 본다."""
    query = db.query(User).filter(User.approval_status == ApprovalStatus.PENDING)
    if reviewer.role == Role.HOMEROOM_TEACHER:
        return query.filter(
            User.role == Role.STUDENT,
            User.grade == reviewer.grade,
            User.class_no == reviewer.class_no,
        ).all()
    if reviewer.role == Role.ADMIN:
        return query.filter(User.role.in_([Role.AREA_TEACHER, Role.HOMEROOM_TEACHER])).all()
    return []


def decide_onboarding(db: Session, user_id: int, approve: bool) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError(f"user {user_id} not found")
    if user.approval_status != ApprovalStatus.PENDING:
        raise InvalidStateError("이미 처리된 가입 요청입니다.")

    user.approval_status = ApprovalStatus.APPROVED if approve else ApprovalStatus.REJECTED
    db.commit()

    if approve and user.role == Role.AREA_TEACHER and user.department in DEPARTMENT_DOMAIN_MAP:
        _assign_teacher_domain(db, user.id, DEPARTMENT_DOMAIN_MAP[user.department])

    db.refresh(user)
    return user


def list_teachers(db: Session) -> list[User]:
    return (
        db.query(User)
        .filter(
            User.role.in_([Role.HOMEROOM_TEACHER, Role.AREA_TEACHER]),
            User.approval_status == ApprovalStatus.APPROVED,
        )
        .order_by(User.name)
        .all()
    )


def set_homeroom_assignment(db: Session, teacher_id: int, grade: int, class_no: int) -> User:
    teacher = db.get(User, teacher_id)
    if teacher is None:
        raise NotFoundError(f"teacher {teacher_id} not found")
    if teacher.role not in (Role.HOMEROOM_TEACHER, Role.AREA_TEACHER):
        raise InvalidStateError("교사 계정만 담임으로 지정할 수 있습니다.")

    # 반당 담임은 1명 — 이미 그 반에 배정된 다른 교사가 있으면 해제
    existing = (
        db.query(User)
        .filter(
            User.role == Role.HOMEROOM_TEACHER,
            User.grade == grade,
            User.class_no == class_no,
            User.id != teacher_id,
        )
        .first()
    )
    if existing is not None:
        existing.grade = None
        existing.class_no = None

    teacher.role = Role.HOMEROOM_TEACHER
    teacher.grade = grade
    teacher.class_no = class_no
    teacher.department = HOMEROOM_DEPARTMENT
    db.commit()
    db.refresh(teacher)
    return teacher


def clear_homeroom_assignment(db: Session, teacher_id: int) -> User:
    teacher = db.get(User, teacher_id)
    if teacher is None:
        raise NotFoundError(f"teacher {teacher_id} not found")
    teacher.grade = None
    teacher.class_no = None
    db.commit()
    db.refresh(teacher)
    return teacher


def _assign_teacher_domain(db: Session, teacher_id: int, domain: Domain) -> None:
    # approvals -> auth 역참조로 인한 순환 임포트를 피하기 위해 지연 임포트
    from app.features.approvals.models import TeacherDomainAssignment

    exists = (
        db.query(TeacherDomainAssignment)
        .filter(TeacherDomainAssignment.teacher_id == teacher_id, TeacherDomainAssignment.domain == domain)
        .first()
    )
    if exists is None:
        db.add(TeacherDomainAssignment(teacher_id=teacher_id, domain=domain))
        db.commit()
