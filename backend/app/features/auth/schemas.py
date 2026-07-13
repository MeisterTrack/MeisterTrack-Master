from typing import Literal

from pydantic import BaseModel

from app.common.enums import ApprovalStatus, Role


class GoogleMockLoginRequest(BaseModel):
    """실제 Google OAuth 클라이언트 발급 전까지 사용하는 mock 로그인 입력.

    실제 연동 시에는 프론트가 OAuth code를 보내고, 이 자리에서 Google 토큰 교환 후
    검증된 email/name을 받아오는 것으로 교체한다 (도메인 검증 로직은 그대로 재사용).
    """

    email: str
    name: str


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
