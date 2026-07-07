from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.common.enums import Domain, Role
from app.core.deps import get_db, require_role
from app.features.submissions import service
from app.features.submissions.schemas import SubmissionCreate, SubmissionResponse
from app.features.submissions.storage import save_submission_file

router = APIRouter()


@router.get("/me", response_model=list[SubmissionResponse])
def list_my_submissions(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.STUDENT)),
) -> list[SubmissionResponse]:
    return service.list_by_student(db, student_id=int(claims["sub"]))


@router.post("", response_model=SubmissionResponse)
def submit(
    background_tasks: BackgroundTasks,
    domain: Domain = Form(...),
    criterion_id: int = Form(...),
    self_reported_text: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.STUDENT)),
) -> SubmissionResponse:
    payload = SubmissionCreate(domain=domain, criterion_id=criterion_id, self_reported_text=self_reported_text)
    student_id = int(claims["sub"])
    file_path = save_submission_file(student_id, file) if file is not None else None
    submission = service.create_submission(db, student_id=student_id, payload=payload, file_path=file_path)

    # ai_review -> submissions 역참조로 인한 순환 임포트를 피하기 위해 지연 임포트
    from app.features.ai_review.service import run_ai_review_in_background

    background_tasks.add_task(run_ai_review_in_background, submission.id)
    return submission
