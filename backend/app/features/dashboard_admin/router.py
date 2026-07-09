from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.dashboard_admin import service
from app.features.dashboard_admin.schemas import AdminOverviewResponse, RecentSubmissionItem

router = APIRouter()


@router.get("/overview", response_model=AdminOverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> AdminOverviewResponse:
    return service.build_overview(db)


@router.get("/recent-submissions", response_model=list[RecentSubmissionItem])
def get_recent_submissions(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> list[RecentSubmissionItem]:
    return service.list_recent_submissions(db)
