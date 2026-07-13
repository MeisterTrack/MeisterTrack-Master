from typing import Literal

from pydantic import BaseModel

from app.common.enums import ApprovalStatus, Role


class GoogleMockLoginRequest(BaseModel):
    """Client ID 발급 전까지만 쓰는 mock 로그인 입력.

    이메일만으로 아무 계정에나 로그인되므로 접근 코드(secret)가 mock_login_secret과 일치해야 하며,
    settings.google_oauth_mock이 False거나 mock_login_secret이 비어있으면 완전히 차단된다.
    """

    email: str
    name: str
    secret: str


class GoogleCallbackRequest(BaseModel):
    """Google Identity Services "Sign in with Google" 콜백에서 받은 ID 토큰(JWT)."""

    id_token: str


class AuthConfigResponse(BaseModel):
    """프론트가 실제 Google 버튼을 그릴지 mock 폼을 보여줄지 판단하는 데 쓰는 공개 설정."""

    google_client_id: str
    mock_enabled: bool


class LoginResult(BaseModel):
    status: Literal["ok", "pending", "needs_onboarding"]
    access_token: str | None = None
    token_type: str = "bearer"
    email: str
    name: str


class OnboardingRequest(BaseModel):
    email: str
    name: str
    role: Literal["student", "teacher"]
    grade: int | None = None  # 학생: 학년 / 담임교사: 담당 학급 학년
    class_no: int | None = None  # 학생: 반 / 담임교사: 담당 학급 반
    student_no: str | None = None  # 학생만
    department: str | None = None  # 교사만: 담임교사/산학협력부/전문교육부/체육교사/영어교과/국어교과


class OnboardingResponse(BaseModel):
    id: int
    email: str
    name: str
    role: Role
    approval_status: ApprovalStatus

    model_config = {"from_attributes": True}


class OnboardingDecision(BaseModel):
    approve: bool


class CurrentUser(BaseModel):
    id: int
    email: str
    name: str
    role: Role
    grade: int | None
    class_no: int | None
    student_no: str | None
    department: str | None

    model_config = {"from_attributes": True}


class TeacherAdminItem(BaseModel):
    id: int
    email: str
    name: str
    role: Role
    department: str | None
    grade: int | None
    class_no: int | None

    model_config = {"from_attributes": True}


class HomeroomAssignmentUpdate(BaseModel):
    grade: int
    class_no: int
