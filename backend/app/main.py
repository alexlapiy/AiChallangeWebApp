from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session


def createApp() -> FastAPI:
    app = FastAPI(title="Shipment API", version="1.0.0")

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
    except Exception:
        # App can still start before routers exist during bootstrap
        pass

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
    except Exception:
        pass

    return app


app = createApp()


