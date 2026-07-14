from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Role
from app.common.exceptions import InvalidStateError, NotFoundError, PermissionDeniedError
from app.core.config import get_settings
from app.core.security import create_access_token
from app.features.auth.models import User
from app.features.auth.schemas import LoginResult, OnboardingRequest, TeacherCreateRequest, TeacherUpdateRequest

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


def check_login_domain(db: Session, email: str) -> None:
    """기존 관리자 계정은 학교 도메인 제한 예외 (별도 프로비저닝이라 Workspace 계정이 아닐 수 있음)."""
    user = find_user_by_email(db, email)
    if user is None or user.role != Role.ADMIN:
        assert_allowed_domain(email)


def issue_token_for(user: User) -> str:
    return create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})


def verify_google_id_token(token: str) -> tuple[str, str]:
    """Google Identity Services "Sign in with Google" 콜백의 ID 토큰을 검증해 (email, name)을 반환한다.

    구글 공개키로 서명을 확인하고 aud(대상)가 우리 client_id인지, 이메일이 인증됐는지까지 확인하므로
    프론트가 임의의 이메일을 주장할 수 없다 (mock 로그인과의 핵심 차이).
    """
    settings = get_settings()
    try:
        payload = google_id_token.verify_oauth2_token(token, google_requests.Request(), settings.google_client_id)
    except ValueError as exc:
        raise PermissionDeniedError("Google 인증 토큰이 유효하지 않습니다.") from exc

    if not payload.get("email_verified"):
        raise PermissionDeniedError("인증되지 않은 Google 이메일입니다.")

    return payload["email"], payload.get("name", payload["email"])


def resolve_login(db: Session, email: str, name: str) -> LoginResult:
    """이메일 도메인 검증 후 가입 여부/승인 상태에 따라 로그인 결과를 분기한다.

    mock 로그인과 실제 Google 콜백 로그인이 검증 이후 공유하는 로직.
    """
    user = find_user_by_email(db, email)

    if user is None:
        return LoginResult(status="needs_onboarding", email=email, name=name)
    if user.approval_status in (ApprovalStatus.PENDING, ApprovalStatus.REJECTED):
        return LoginResult(status="pending", email=user.email, name=user.name)

    return LoginResult(
        status="ok",
        access_token=issue_token_for(user),
        email=user.email,
        name=user.name,
    )


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


def list_teachers(db: Session, include_inactive: bool = False) -> list[User]:
    query = db.query(User).filter(User.role.in_([Role.HOMEROOM_TEACHER, Role.AREA_TEACHER]))
    if not include_inactive:
        query = query.filter(User.approval_status == ApprovalStatus.APPROVED)
    return query.order_by(User.name).all()


def create_teacher(db: Session, payload: TeacherCreateRequest) -> User:
    """관리자가 직접 교사 계정을 생성 — 온보딩 승인 없이 바로 사용 가능한 계정을 만든다."""
    assert_allowed_domain(payload.email)
    if payload.department not in TEACHER_DEPARTMENTS:
        raise InvalidStateError("담당 교과/부서를 올바르게 선택해주세요.")
    if find_user_by_email(db, payload.email) is not None:
        raise InvalidStateError("이미 가입된 계정입니다.")

    role = Role.HOMEROOM_TEACHER if payload.department == HOMEROOM_DEPARTMENT else Role.AREA_TEACHER
    teacher = User(
        email=payload.email,
        name=payload.name,
        role=role,
        department=payload.department,
        approval_status=ApprovalStatus.APPROVED,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    if role == Role.HOMEROOM_TEACHER and payload.grade is not None and payload.class_no is not None:
        set_homeroom_assignment(db, teacher.id, payload.grade, payload.class_no)
    elif role == Role.AREA_TEACHER and payload.department in DEPARTMENT_DOMAIN_MAP:
        _assign_teacher_domain(db, teacher.id, DEPARTMENT_DOMAIN_MAP[payload.department])

    db.refresh(teacher)
    return teacher


def update_teacher(db: Session, teacher_id: int, payload: TeacherUpdateRequest) -> User:
    teacher = db.get(User, teacher_id)
    if teacher is None:
        raise NotFoundError(f"teacher {teacher_id} not found")
    if payload.department not in TEACHER_DEPARTMENTS:
        raise InvalidStateError("담당 교과/부서를 올바르게 선택해주세요.")

    new_role = Role.HOMEROOM_TEACHER if payload.department == HOMEROOM_DEPARTMENT else Role.AREA_TEACHER
    teacher.name = payload.name
    teacher.department = payload.department
    if new_role != Role.HOMEROOM_TEACHER:
        teacher.grade = None
        teacher.class_no = None
    teacher.role = new_role

    if new_role == Role.AREA_TEACHER and payload.department in DEPARTMENT_DOMAIN_MAP:
        _assign_teacher_domain(db, teacher.id, DEPARTMENT_DOMAIN_MAP[payload.department])

    db.commit()
    db.refresh(teacher)
    return teacher


def set_teacher_active(db: Session, teacher_id: int, active: bool) -> User:
    """교사 계정 비활성화/재활성화. 별도 컬럼 없이 기존 승인 상태(ApprovalStatus)를 재사용한다."""
    teacher = db.get(User, teacher_id)
    if teacher is None:
        raise NotFoundError(f"teacher {teacher_id} not found")
    teacher.approval_status = ApprovalStatus.APPROVED if active else ApprovalStatus.REJECTED
    db.commit()
    db.refresh(teacher)
    return teacher


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
