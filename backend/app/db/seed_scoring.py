"""배점 규칙 임시 시드 데이터.

명세서 부록(운영계획서 원본 요약)의 영역별 배점 비율만 반영한 PLACEHOLDER다.
항목별 정확한 배점/등급 커트라인은 운영계획서 II장 원본을 받는 대로 교체해야 한다.
실행: docker compose exec backend python -m app.db.seed_scoring
"""

from app.common.enums import Domain, Grade
from app.db.session import SessionLocal
from app.features.scoring.models import GradeThreshold, ScoringCriterion

# domain: (영역 총 배점, [(항목명, 배점), ...])
# 총 배점은 부록의 배점 비율(%)을 100점 만점 기준 그대로 사용.
SCORING_CRITERIA_SEED: dict[Domain, list[tuple[str, float]]] = {
    Domain.BASIC_JOB_COMPETENCY: [
        ("국어/영어 의사소통능력", 4),
        ("수리활용능력", 3),
        ("문제해결능력", 3),
    ],
    Domain.TECHNICAL_COMPETENCY: [
        ("전공 포트폴리오", 8),
        ("프로젝트 참여", 6),
        ("SW 대회 입상", 6),
        ("정보처리산업기사", 5),
        ("전공 관련 자격증(TOPCIT/리눅스/자바/윈도우/기능사 등)", 5),
    ],
    Domain.CHARACTER_WORK_ETHIC: [
        ("그린마일리지", 4),
        ("출결", 4),
        ("봉사활동(재학기간 90시간 기준)", 6),
        ("인성 표창", 3),
        ("체육활동 참가", 3),
    ],
    Domain.HUMANITIES_LITERACY: [
        ("권장도서 100선 독후활동(연 10권)", 10),
        ("인문교과 대회 참여", 5),
        ("한자/한국사 자격증", 5),
    ],
    Domain.FOREIGN_LANGUAGE: [
        ("영어 읽기 활동", 6),
        ("TOEIC/HSK/JLPT 등 공인시험", 8),
        ("영어캠프/말하기대회", 6),
    ],
}

# 영역별 S/A/B 등급 커트라인 — 100점 만점 기준 임시값(90/80/70).
GRADE_THRESHOLD_SEED: list[tuple[Grade, float]] = [
    (Grade.S, 90),
    (Grade.A, 80),
    (Grade.B, 70),
]


def seed_scoring_data() -> None:
    db = SessionLocal()
    try:
        if db.query(ScoringCriterion).first() is not None:
            print("이미 시드 데이터가 존재합니다. 건너뜁니다.")
            return

        for domain, criteria in SCORING_CRITERIA_SEED.items():
            for name, max_score in criteria:
                db.add(ScoringCriterion(domain=domain, name=name, max_score=max_score))
            for grade, min_score in GRADE_THRESHOLD_SEED:
                db.add(GradeThreshold(domain=domain, grade=grade, min_score=min_score))

        db.commit()
        print("배점 규칙 임시 시드 데이터 입력 완료 (운영계획서 원본 수령 후 교체 필요).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_scoring_data()
