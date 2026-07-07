from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.common.enums import Domain
from app.features.ai_review.nvidia_client import call_with_retry, get_nvidia_client, is_ai_enabled
from app.features.scoring.models import ScoringCriterion


@dataclass
class OcrRecommendation:
    suggested_criterion_id: int | None
    confidence: float
    raw_model_output: str | None


def recommend_criterion_from_image(db: Session, image_path: str, domain: Domain) -> OcrRecommendation:
    """자격증/상장 이미지를 인증기준표 항목과 매칭하여 추천값 + 신뢰도를 반환.

    실제로는 OCR로 텍스트를 추출한 뒤 tool-calling으로 criterion_id를 고르게 하는 2단계 파이프라인이 되어야 한다.
    NVIDIA_API_KEY가 없는 현재는 mock 경로로 동작하며, 키 발급 시 _call_nim만 실제 프롬프트로 교체하면 된다.
    """
    candidates = db.query(ScoringCriterion).filter(ScoringCriterion.domain == domain).all()
    if not candidates:
        return OcrRecommendation(suggested_criterion_id=None, confidence=0.0, raw_model_output=None)

    if not is_ai_enabled():
        return _mock_recommendation(image_path, candidates)

    return _call_nim(image_path, candidates)


def _mock_recommendation(image_path: str, candidates: list[ScoringCriterion]) -> OcrRecommendation:
    # 키 없이도 파이프라인 배선을 검증할 수 있도록 첫 번째 후보를 낮은 신뢰도로 추천.
    best = candidates[0]
    return OcrRecommendation(
        suggested_criterion_id=best.id,
        confidence=0.3,
        raw_model_output=f"[mock] no NVIDIA_API_KEY configured, image={image_path}",
    )


def _call_nim(image_path: str, candidates: list[ScoringCriterion]) -> OcrRecommendation:
    client = get_nvidia_client()
    from app.core.config import get_settings

    settings = get_settings()
    criteria_list = "\n".join(f"- id={c.id}: {c.name}" for c in candidates)

    def _do_call():
        return client.chat.completions.create(
            model=settings.nvidia_model_name,
            messages=[
                {
                    "role": "system",
                    "content": "너는 자격증/상장 이미지 설명을 읽고 아래 인증기준표 항목 중 가장 알맞은 것의 id를 고르는 평가 보조자다.",
                },
                {
                    "role": "user",
                    "content": f"인증기준표 항목:\n{criteria_list}\n\n이미지 경로: {image_path}\n가장 알맞은 항목의 id만 답하라.",
                },
            ],
        )

    response = call_with_retry(_do_call)
    raw_output = response.choices[0].message.content or ""

    matched = next((c for c in candidates if str(c.id) in raw_output), None)
    return OcrRecommendation(
        suggested_criterion_id=matched.id if matched else None,
        confidence=0.8 if matched else 0.2,
        raw_model_output=raw_output,
    )
