from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.ai_review import service
from app.features.ai_review.schemas import AiReviewResultResponse

router = APIRouter()


@router.get("/submissions/{submission_id}", response_model=AiReviewResultResponse)
def get_ai_review_result(
    submission_id: int,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.TEACHER, Role.ADMIN)),
) -> AiReviewResultResponse:
    result = service.get_result_for_submission(db, submission_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI 검증 결과가 아직 없습니다.")
    return result
