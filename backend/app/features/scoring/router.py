from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.enums import Domain, Role
from app.core.deps import get_current_user_claims, get_db, require_role
from app.features.scoring import service
from app.features.scoring.models import ScoringCriterion
from app.features.scoring.schemas import (
    GradeThresholdCreate,
    GradeThresholdResponse,
    GradeThresholdUpdate,
    ScoringCriterionCreate,
    ScoringCriterionResponse,
    ScoringCriterionUpdate,
)

router = APIRouter()


@router.get("/criteria", response_model=list[ScoringCriterionResponse])
def list_criteria(
    domain: Domain | None = None,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
) -> list[ScoringCriterionResponse]:
    """증빙 제출 폼에서 항목 선택에 쓰이므로 로그인한 사용자면 누구나 조회 가능(읽기 전용)."""
    query = db.query(ScoringCriterion)
    if domain is not None:
        query = query.filter(ScoringCriterion.domain == domain)
    return query.all()


@router.post("/criteria", response_model=ScoringCriterionResponse)
def create_criterion(
    payload: ScoringCriterionCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> ScoringCriterionResponse:
    return service.create_criterion(db, payload)


@router.put("/criteria/{criterion_id}", response_model=ScoringCriterionResponse)
def update_criterion(
    criterion_id: int,
    payload: ScoringCriterionUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> ScoringCriterionResponse:
    return service.update_criterion(db, criterion_id, payload)


@router.delete("/criteria/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_criterion(
    criterion_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> None:
    service.delete_criterion(db, criterion_id)


@router.get("/grade-thresholds", response_model=list[GradeThresholdResponse])
def list_grade_thresholds(
    domain: Domain | None = None,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
) -> list[GradeThresholdResponse]:
    return service.list_grade_thresholds(db, domain)


@router.post("/grade-thresholds", response_model=GradeThresholdResponse)
def create_grade_threshold(
    payload: GradeThresholdCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> GradeThresholdResponse:
    return service.create_grade_threshold(db, payload)


@router.put("/grade-thresholds/{threshold_id}", response_model=GradeThresholdResponse)
def update_grade_threshold(
    threshold_id: int,
    payload: GradeThresholdUpdate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> GradeThresholdResponse:
    return service.update_grade_threshold(db, threshold_id, payload)


@router.delete("/grade-thresholds/{threshold_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade_threshold(
    threshold_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> None:
    service.delete_grade_threshold(db, threshold_id)
