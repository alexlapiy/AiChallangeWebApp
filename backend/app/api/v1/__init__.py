from fastapi import APIRouter
import logging


router = APIRouter()
logger = logging.getLogger(__name__)

# Sub-routers will be included here once created
try:
    from .orders import router as orders_router  # type: ignore
    router.include_router(orders_router, prefix="/orders", tags=["orders"])
except Exception as e:
    logger.exception("Failed to include orders router: %s", e)

try:
    from .cities import router as cities_router  # type: ignore
    router.include_router(cities_router, prefix="/cities", tags=["cities"])
except Exception as e:
    logger.exception("Failed to include cities router: %s", e)

try:
    from .tariffs import router as tariffs_router  # type: ignore
    router.include_router(tariffs_router, prefix="/tariffs", tags=["tariffs"])
except Exception as e:
    logger.exception("Failed to include tariffs router: %s", e)

try:
    from .users import router as users_router  # type: ignore
    router.include_router(users_router, prefix="/users", tags=["users"])
except Exception as e:
    logger.exception("Failed to include users router: %s", e)

try:
    from .meta import router as meta_router  # type: ignore
    router.include_router(meta_router, prefix="/meta", tags=["meta"])
except Exception as e:
    logger.exception("Failed to include meta router: %s", e)


