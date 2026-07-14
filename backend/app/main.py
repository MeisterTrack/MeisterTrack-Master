from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.common.exceptions import InvalidStateError, NotFoundError, PermissionDeniedError
from app.features.ai_review import router as ai_review_router
from app.features.approvals import router as approvals_router
from app.features.audit_log import router as audit_log_router
from app.features.auth import router as auth_router
from app.features.dashboard_admin import router as dashboard_admin_router
from app.features.dashboard_student import router as dashboard_student_router
from app.features.dashboard_teacher import router as dashboard_teacher_router
from app.features.scoring import router as scoring_router
from app.features.submissions import router as submissions_router

app = FastAPI(title="MeisterTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 배포 시 프론트엔드 도메인으로 제한
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(submissions_router, prefix="/api/submissions", tags=["submissions"])
app.include_router(ai_review_router, prefix="/api/ai-review", tags=["ai_review"])
app.include_router(approvals_router, prefix="/api/approvals", tags=["approvals"])
app.include_router(scoring_router, prefix="/api/scoring", tags=["scoring"])
app.include_router(dashboard_student_router, prefix="/api/dashboard/student", tags=["dashboard_student"])
app.include_router(dashboard_admin_router, prefix="/api/dashboard/admin", tags=["dashboard_admin"])
app.include_router(dashboard_teacher_router, prefix="/api/dashboard/teacher", tags=["dashboard_teacher"])
app.include_router(audit_log_router, prefix="/api/audit-logs", tags=["audit_log"])


@app.exception_handler(NotFoundError)
def handle_not_found(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"success": False, "data": None, "error": str(exc)})


@app.exception_handler(InvalidStateError)
def handle_invalid_state(request: Request, exc: InvalidStateError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"success": False, "data": None, "error": str(exc)})


@app.exception_handler(PermissionDeniedError)
def handle_permission_denied(request: Request, exc: PermissionDeniedError) -> JSONResponse:
    return JSONResponse(status_code=403, content={"success": False, "data": None, "error": str(exc)})


@app.get("/api/health")
def health_check() -> dict:
    return {"success": True, "data": {"status": "ok"}, "error": None}
