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
    grade: int | None = None  # 학생: 학년 / 교사: 담임 학급 학년(담임인 경우만)
    class_no: int | None = None  # 학생: 반 / 교사: 담임 학급 반(담임인 경우만)
    student_no: str | None = None  # 학생만
    department: str | None = None  # 교사만: 담당 부서 (산학협력부/전문교육부)
    subject: str | None = None  # 교사만: 담당 교과 (국어/영어/체육)


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
    subject: str | None

    model_config = {"from_attributes": True}


class TeacherAdminItem(BaseModel):
    id: int
    email: str
    name: str
    role: Role
    department: str | None
    subject: str | None
    grade: int | None
    class_no: int | None
    approval_status: ApprovalStatus

    model_config = {"from_attributes": True}


class HomeroomAssignmentUpdate(BaseModel):
    grade: int
    class_no: int


class TeacherCreateRequest(BaseModel):
    """관리자가 직접 교사 계정을 생성할 때 입력. 온보딩 승인 절차 없이 바로 APPROVED로 만들어진다.

    담임 여부(grade/class_no)와 담당 부서/교과는 서로 독립적 — 겸직 가능.
    """

    email: str
    name: str
    department: str | None = None  # 산학협력부/전문교육부
    subject: str | None = None  # 국어/영어/체육
    grade: int | None = None  # 담임 학급 학년 (담임인 경우만)
    class_no: int | None = None  # 담임 학급 반 (담임인 경우만)


class TeacherUpdateRequest(BaseModel):
    name: str
    department: str | None = None
    subject: str | None = None
