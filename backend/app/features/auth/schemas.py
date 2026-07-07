from pydantic import BaseModel

from app.common.enums import Role


class LoginRequest(BaseModel):
    login_id: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUser(BaseModel):
    id: int
    login_id: str
    name: str
    role: Role
