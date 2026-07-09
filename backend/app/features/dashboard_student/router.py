from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.dashboard_student import service
from app.features.dashboard_student.schemas import StudentDashboardResponse, StudentDetailResponse

router = APIRouter()


@router.get("/me", response_model=StudentDashboardResponse)
def get_my_dashboard(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.STUDENT)),
) -> StudentDashboardResponse:
    return service.build_dashboard(db, student_id=int(claims["sub"]))


@router.get("/{student_id}", response_model=StudentDetailResponse)
def get_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.AREA_TEACHER, Role.HOMEROOM_TEACHER, Role.ADMIN)),
) -> StudentDetailResponse:
    return service.build_student_detail(db, student_id)
