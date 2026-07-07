class MeisterTrackError(Exception):
    """앱 공용 예외 베이스 클래스"""


class NotFoundError(MeisterTrackError):
    pass


class PermissionDeniedError(MeisterTrackError):
    pass


class InvalidStateError(MeisterTrackError):
    """상태 전이(예: 이미 승인된 건 재반려)가 불가능할 때"""
