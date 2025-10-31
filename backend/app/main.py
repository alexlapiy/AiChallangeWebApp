from fastapi import FastAPI, Request, HTTPException
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session


def createApp() -> FastAPI:
    app = FastAPI(title="Shipment API", version="1.0.0")
    logger = logging.getLogger(__name__)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers are included in app/api/v1/__init__.py to keep main minimal
    try:
        from app.api.v1 import router as api_v1_router  # type: ignore

        app.include_router(api_v1_router, prefix="/api/v1")
        logger.info("API v1 router included with %d routes", len(app.router.routes))
    except Exception as e:
        logger.exception("Failed to include API v1 router: %s", e)

    # Dev bootstrap seed
    try:
        from app.infra.db import SessionLocal  # type: ignore
        from app.infra.seed import runBootstrap  # type: ignore

        @app.on_event("startup")
        def _seed() -> None:
            session: Session = SessionLocal()
            try:
                runBootstrap(session)
                session.commit()
            finally:
                session.close()
    except Exception as e:
        logger.exception("Startup seed failed: %s", e)

    @app.exception_handler(HTTPException)
    def http_exception_handler(_: Request, exc: HTTPException):
        # Normalize error to {"error": message}
        detail = exc.detail
        if isinstance(detail, dict) and "error" in detail:
            message = detail["error"]
        else:
            message = str(detail)
        return JSONResponse(status_code=exc.status_code, content={"error": message})

    @app.exception_handler(ValueError)
    def value_error_handler(_: Request, exc: ValueError):
        return JSONResponse(status_code=400, content={"error": str(exc)})

    return app


app = createApp()


