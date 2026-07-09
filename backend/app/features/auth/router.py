from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Role
from app.core.deps import get_current_user, get_db, require_role
from app.features.auth import service
from app.features.auth.models import User
from app.features.auth.schemas import (
    CurrentUser,
    GoogleMockLoginRequest,
    LoginResult,
    OnboardingDecision,
    OnboardingRequest,
    OnboardingResponse,
)

router = APIRouter()


@router.post("/google/mock-login", response_model=LoginResult)
def google_mock_login(payload: GoogleMockLoginRequest, db: Session = Depends(get_db)) -> LoginResult:
    """실제 Google OAuth 클라이언트 발급 전까지 쓰는 mock 로그인.

    프론트는 이 응답의 status를 보고 분기한다:
    - needs_onboarding: 처음 로그인 -> 온보딩 화면으로
    - pending: 온보딩은 했지만 담임/관리자 승인 대기중
    - ok: 정상 로그인, access_token 발급됨
    """
    service.assert_allowed_domain(payload.email)
    user = service.find_user_by_email(db, payload.email)

    if user is None:
        return LoginResult(status="needs_onboarding", email=payload.email, name=payload.name)
    if user.approval_status == ApprovalStatus.PENDING:
        return LoginResult(status="pending", email=user.email, name=user.name)
    if user.approval_status == ApprovalStatus.REJECTED:
        return LoginResult(status="pending", email=user.email, name=user.name)

    return LoginResult(
        status="ok",
        access_token=service.issue_token_for(user),
        email=user.email,
        name=user.name,
    )


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
