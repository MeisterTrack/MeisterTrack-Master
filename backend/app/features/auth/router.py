import secrets

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.common.exceptions import PermissionDeniedError
from app.core.config import get_settings
from app.core.deps import get_current_user, get_db, require_role
from app.features.auth import service
from app.features.auth.models import User
from app.features.auth.schemas import (
    AuthConfigResponse,
    CurrentUser,
    GoogleCallbackRequest,
    GoogleMockLoginRequest,
    HomeroomAssignmentUpdate,
    LoginResult,
    OnboardingDecision,
    OnboardingRequest,
    OnboardingResponse,
    TeacherAdminItem,
)

router = APIRouter()


@router.get("/config", response_model=AuthConfigResponse)
def get_auth_config() -> AuthConfigResponse:
    """프론트가 실제 Google 버튼을 그릴지 mock 폼을 보여줄지 판단하는 공개 설정."""
    settings = get_settings()
    return AuthConfigResponse(google_client_id=settings.google_client_id, mock_enabled=settings.google_oauth_mock)


@router.post("/google/mock-login", response_model=LoginResult)
def google_mock_login(payload: GoogleMockLoginRequest, db: Session = Depends(get_db)) -> LoginResult:
    """Client ID 발급 전까지만 쓰는 mock 로그인.

    이메일만으로 아무 계정에나 로그인되므로 mock_login_secret이 설정돼 있고 일치할 때만 허용한다
    (fail-closed: 코드가 설정 안 돼 있으면 무조건 차단).
    """
    settings = get_settings()
    if not settings.google_oauth_mock:
        raise PermissionDeniedError("mock 로그인은 비활성화되어 있습니다. 실제 Google 로그인을 이용해주세요.")
    if not settings.mock_login_secret or not secrets.compare_digest(payload.secret, settings.mock_login_secret):
        raise PermissionDeniedError("접근 코드가 올바르지 않습니다.")

    service.check_login_domain(db, payload.email)
    return service.resolve_login(db, payload.email, payload.name)


@router.post("/google/callback", response_model=LoginResult)
def google_callback(payload: GoogleCallbackRequest, db: Session = Depends(get_db)) -> LoginResult:
    """Google Identity Services "Sign in with Google" 콜백 — ID 토큰을 서버에서 검증한다."""
    email, name = service.verify_google_id_token(payload.id_token)
    service.check_login_domain(db, email)
    return service.resolve_login(db, email, name)


@router.post("/onboarding", response_model=OnboardingResponse)
def onboarding(payload: OnboardingRequest, db: Session = Depends(get_db)) -> OnboardingResponse:
    return service.create_onboarding_user(db, payload)


@router.get("/onboarding-requests", response_model=list[OnboardingResponse])
def list_onboarding_requests(
    db: Session = Depends(get_db),
    reviewer: User = Depends(get_current_user),
    _claims: dict = Depends(require_role(Role.HOMEROOM_TEACHER, Role.ADMIN)),
) -> list[OnboardingResponse]:
    return service.list_pending_onboarding(db, reviewer)


@router.post("/onboarding-requests/{user_id}/decision", response_model=OnboardingResponse)
def decide_onboarding_request(
    user_id: int,
    decision: OnboardingDecision,
    db: Session = Depends(get_db),
    _claims: dict = Depends(require_role(Role.HOMEROOM_TEACHER, Role.ADMIN)),
) -> OnboardingResponse:
    return service.decide_onboarding(db, user_id, decision.approve)


@router.get("/me", response_model=CurrentUser)
def read_me(user: User = Depends(get_current_user)) -> CurrentUser:
    return user


@router.get("/teachers", response_model=list[TeacherAdminItem])
def list_teachers(
    db: Session = Depends(get_db),
    _claims: dict = Depends(require_role(Role.ADMIN)),
) -> list[TeacherAdminItem]:
    return service.list_teachers(db)


@router.put("/teachers/{teacher_id}/homeroom", response_model=TeacherAdminItem)
def set_homeroom(
    teacher_id: int,
    payload: HomeroomAssignmentUpdate,
    db: Session = Depends(get_db),
    _claims: dict = Depends(require_role(Role.ADMIN)),
) -> TeacherAdminItem:
    return service.set_homeroom_assignment(db, teacher_id, payload.grade, payload.class_no)


@router.delete("/teachers/{teacher_id}/homeroom", response_model=TeacherAdminItem)
def clear_homeroom(
    teacher_id: int,
    db: Session = Depends(get_db),
    _claims: dict = Depends(require_role(Role.ADMIN)),
) -> TeacherAdminItem:
    return service.clear_homeroom_assignment(db, teacher_id)
