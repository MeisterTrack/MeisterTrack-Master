from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Domain
from app.core.deps import get_current_user_claims, get_db
from app.features.scoring.models import ScoringCriterion
from app.features.scoring.schemas import ScoringCriterionResponse

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
