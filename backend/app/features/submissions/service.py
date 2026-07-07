from sqlalchemy.orm import Session

from app.features.submissions.models import Submission
from app.features.submissions.schemas import SubmissionCreate


def list_by_student(db: Session, student_id: int) -> list[Submission]:
    return db.query(Submission).filter(Submission.student_id == student_id).order_by(Submission.created_at.desc()).all()


def create_submission(db: Session, student_id: int, payload: SubmissionCreate, file_path: str | None) -> Submission:
    submission = Submission(
        student_id=student_id,
        domain=payload.domain,
        criterion_id=payload.criterion_id,
        self_reported_text=payload.self_reported_text,
        file_path=file_path,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission
