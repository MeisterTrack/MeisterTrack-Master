import enum


class Role(str, enum.Enum):
    STUDENT = "student"
    HOMEROOM_TEACHER = "homeroom_teacher"
    AREA_TEACHER = "area_teacher"
    ADMIN = "admin"


class Domain(str, enum.Enum):
    """5개 인증 영역 (대분류)"""

    BASIC_JOB_COMPETENCY = "basic_job_competency"  # 직업기초능력
    TECHNICAL_COMPETENCY = "technical_competency"  # 전문기술역량
    CHARACTER_WORK_ETHIC = "character_work_ethic"  # 인성/직업의식
    HUMANITIES_LITERACY = "humanities_literacy"  # 인문학적 소양
    FOREIGN_LANGUAGE = "foreign_language"  # 외국어 능력


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"  # 대기
    APPROVED = "approved"  # 승인
    REJECTED = "rejected"  # 반려


class Grade(str, enum.Enum):
    S = "S"
    A = "A"
    B = "B"
