from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_current_user, get_db, require_role
from app.features.auth.models import User
from app.features.dashboard_teacher import service
from app.features.dashboard_teacher.schemas import TeacherOverviewResponse

router = APIRouter()


@router.get("/overview", response_model=TeacherOverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _claims: dict = Depends(require_role(Role.HOMEROOM_TEACHER, Role.AREA_TEACHER)),
) -> TeacherOverviewResponse:
    return service.build_overview(db, user)
