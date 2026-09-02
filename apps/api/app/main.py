from __future__ import annotations

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings
from app.core.errors import AxiomError
from app.core.logging import log_event
from app.services.device_engine import device_bridge_loop

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    stop_event = asyncio.Event()
    task = asyncio.create_task(device_bridge_loop(stop_event)) if settings.device_engine_host else None
    try:
        yield
    finally:
        stop_event.set()
        if task:
            try:
                await asyncio.wait_for(task, timeout=3.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                task.cancel()


app = FastAPI(
    title="Axiom Imaging API",
    version="0.2.0",
    description=(
        "Research and educational medical-imaging operations prototype. "
        "Not intended for clinical diagnosis or clinical decision-making."
    ),
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(router)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    try:
        response = await call_next(request)
    except Exception:
        log_event("request_failed", severity="ERROR", request_id=request_id, path=request.url.path)
        raise
    response.headers["x-request-id"] = request_id
    return response


@app.exception_handler(AxiomError)
async def axiom_error_handler(request: Request, exc: AxiomError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details or {},
                "request_id": getattr(request.state, "request_id", None),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    log_event(
        "unhandled_api_error",
        severity="ERROR",
        request_id=request_id,
        path=request.url.path,
        error_type=type(exc).__name__,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "The request could not be completed due to an internal server error.",
                "details": {},
                "request_id": request_id,
            }
        },
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "Axiom Imaging API",
        "status": "online",
        "version": "0.2.0",
        "disclaimer": "Research and educational prototype. Not for clinical use.",
    }
