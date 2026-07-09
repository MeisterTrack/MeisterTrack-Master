from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.common.enums import DOMAIN_LABEL, ApprovalStatus, Domain, Grade
from app.features.scoring import service as scoring_service
from app.features.scoring.models import ScoringCriterion
from app.features.submissions.models import Submission

GRADE_GAP_RATIO_THRESHOLD = 0.15  # 다음 등급까지 남은 점수가 영역 만점의 15% 이내면 "근접"으로 판단
SLOW_PROGRESS_RATIO_THRESHOLD = 0.4  # 누적 점수가 영역 만점의 40% 미만이면 "진행 속도 저조"로 판단


@dataclass
class Recommendation:
    domain: Domain
    kind: str  # grade_gap | max_grade | slow_progress
    message: str


def generate_recommendations(db: Session, student_id: int) -> list[Recommendation]:
    """학생별 등급 격차 분석 + 다음 행동 추천 (F-10).

    현재 제출 이력과 배점 규칙(scoring_criteria/grade_thresholds)을 기준으로 매 요청마다 계산한다.
    300명 규모에서는 캐시 없이도 충분히 빠르므로, 배점 규칙 변경 시 자동 갱신되는 캐시 무효화 로직을
    별도로 두지 않고 항상 최신 데이터로 재계산하는 쪽을 택했다.
    """
    recommendations: list[Recommendation] = []

    for domain in Domain:
        total = scoring_service.calculate_domain_total(db, student_id, domain)
        max_score = scoring_service.calculate_domain_max(db, domain)
        grade = scoring_service.resolve_grade(db, domain, total)
        gap = scoring_service.next_grade_gap(db, domain, total)
        label = DOMAIN_LABEL[domain]

        if gap is not None and max_score > 0:
            next_grade, points_needed = gap
            if points_needed / max_score <= GRADE_GAP_RATIO_THRESHOLD:
                candidate = _find_unsubmitted_criterion(db, student_id, domain)
                suggestion = f"'{candidate.name}' 추가 시 도달 가능" if candidate else "관련 항목 추가 제출 검토"
                current_label = grade.value if grade else "미달"
                recommendations.append(
                    Recommendation(
                        domain=domain,
                        kind="grade_gap",
                        message=(
                            f"{label} {current_label}→{next_grade.value}까지 "
                            f"{points_needed:.0f}점 부족 — {suggestion}"
                        ),
                    )
                )
                continue

        if grade == Grade.S:
            candidate = _find_unsubmitted_criterion(db, student_id, domain)
            if candidate:
                recommendations.append(
                    Recommendation(
                        domain=domain,
                        kind="max_grade",
                        message=f"{label} S등급 도달 — 다양화를 위해 '{candidate.name}' 추가 추천",
                    )
                )
                continue

        if max_score > 0 and total / max_score < SLOW_PROGRESS_RATIO_THRESHOLD:
            recommendations.append(
                Recommendation(
                    domain=domain,
                    kind="slow_progress",
                    message=f"{label} 누적 {total:.0f}점 / 목표 {max_score:.0f}점 — 진행 속도 점검이 필요합니다",
                )
            )

    return recommendations


def _find_unsubmitted_criterion(db: Session, student_id: int, domain: Domain) -> ScoringCriterion | None:
    submitted_criterion_ids = (
        db.query(Submission.criterion_id)
        .filter(
            Submission.student_id == student_id,
            Submission.domain == domain,
            Submission.status != ApprovalStatus.REJECTED,
        )
        .subquery()
    )
    return (
        db.query(ScoringCriterion)
        .filter(ScoringCriterion.domain == domain, ScoringCriterion.id.notin_(submitted_criterion_ids))
        .order_by(ScoringCriterion.max_score.desc())
        .first()
    )
