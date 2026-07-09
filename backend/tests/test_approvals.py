import pytest

from app.common.enums import ApprovalStatus, Domain, Role
from app.common.exceptions import InvalidStateError, NotFoundError
from app.features.approvals import service as approvals_service
from app.features.approvals.models import TeacherDomainAssignment
from app.features.approvals.schemas import ApprovalDecision
from app.features.audit_log.models import AuditLog
from app.features.auth.models import User
from app.features.submissions.models import Submission


def _make_user(db, role, **kwargs):
    email = f"user-{role.value}-{kwargs.get('grade')}-{kwargs.get('class_no')}@bssm.hs.kr"
    user = User(email=email, name="테스트", role=role, approval_status=ApprovalStatus.APPROVED, **kwargs)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_submission(db, student_id, domain, status=ApprovalStatus.PENDING):
    submission = Submission(student_id=student_id, domain=domain, criterion_id=1, status=status)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def test_decide_approve_updates_status_and_writes_audit_log(db):
    reviewer = _make_user(db, Role.AREA_TEACHER)
    submission = _make_submission(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    result = approvals_service.decide(db, submission.id, reviewer.id, ApprovalDecision(approve=True))

    assert result.status == ApprovalStatus.APPROVED
    assert result.reject_reason is None
    audit_entries = db.query(AuditLog).filter(AuditLog.target_id == submission.id).all()
    assert len(audit_entries) == 1
    assert audit_entries[0].action == "approve"


def test_decide_reject_stores_reason(db):
    reviewer = _make_user(db, Role.AREA_TEACHER)
    submission = _make_submission(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    result = approvals_service.decide(
        db, submission.id, reviewer.id, ApprovalDecision(approve=False, reject_reason="증빙 불충분")
    )

    assert result.status == ApprovalStatus.REJECTED
    assert result.reject_reason == "증빙 불충분"


def test_decide_twice_raises_invalid_state(db):
    reviewer = _make_user(db, Role.AREA_TEACHER)
    submission = _make_submission(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)
    approvals_service.decide(db, submission.id, reviewer.id, ApprovalDecision(approve=True))

    with pytest.raises(InvalidStateError):
        approvals_service.decide(db, submission.id, reviewer.id, ApprovalDecision(approve=True))


def test_decide_missing_submission_raises_not_found(db):
    reviewer = _make_user(db, Role.AREA_TEACHER)

    with pytest.raises(NotFoundError):
        approvals_service.decide(db, 9999, reviewer.id, ApprovalDecision(approve=True))


def test_list_pending_for_area_teacher_filters_by_assigned_domain(db):
    teacher = _make_user(db, Role.AREA_TEACHER)
    db.add(TeacherDomainAssignment(teacher_id=teacher.id, domain=Domain.TECHNICAL_COMPETENCY))
    db.commit()

    matching = _make_submission(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)
    _make_submission(db, student_id=1, domain=Domain.FOREIGN_LANGUAGE)  # 담당 아님

    queue = approvals_service.list_pending_for_area_teacher(db, teacher.id)

    assert [s.id for s in queue] == [matching.id]


def test_list_pending_for_homeroom_teacher_filters_by_class(db):
    teacher = _make_user(db, Role.HOMEROOM_TEACHER, grade=1, class_no=2)
    same_class_student = _make_user(db, Role.STUDENT, grade=1, class_no=2)
    other_class_student = _make_user(db, Role.STUDENT, grade=1, class_no=3)

    matching = _make_submission(db, same_class_student.id, Domain.CHARACTER_WORK_ETHIC)
    _make_submission(db, other_class_student.id, Domain.CHARACTER_WORK_ETHIC)  # 다른 반
    _make_submission(db, same_class_student.id, Domain.TECHNICAL_COMPETENCY)  # 담임 담당 영역 아님

    queue = approvals_service.list_pending_for_homeroom_teacher(db, teacher.id)

    assert [s.id for s in queue] == [matching.id]
