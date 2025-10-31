from fastapi import APIRouter


router = APIRouter()

# Sub-routers will be included here once created
try:
    from .orders import router as orders_router  # type: ignore
    router.include_router(orders_router, prefix="/orders", tags=["orders"])
except Exception:
    pass

try:
    from .cities import router as cities_router  # type: ignore
    router.include_router(cities_router, prefix="/cities", tags=["cities"])
except Exception:
    pass

try:
    from .tariffs import router as tariffs_router  # type: ignore
    router.include_router(tariffs_router, prefix="/tariffs", tags=["tariffs"])
except Exception:
    pass

try:
    from .users import router as users_router  # type: ignore
    router.include_router(users_router, prefix="/users", tags=["users"])
except Exception:
    pass

try:
    from .meta import router as meta_router  # type: ignore
    router.include_router(meta_router, prefix="/meta", tags=["meta"])
except Exception:
    pass


