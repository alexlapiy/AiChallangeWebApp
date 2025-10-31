from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.repositories.fixed_route_repo import FixedRouteRepository
from app.schemas.meta import FixedRouteDto


router = APIRouter()


@router.get("/fixed-routes", response_model=list[FixedRouteDto])
def listFixedRoutes(session: Session = Depends(getSession)) -> list[FixedRouteDto]:
    repo = FixedRouteRepository(session)
    items = repo.listAll()
    return [FixedRouteDto(from_city=x.from_city, to_city=x.to_city, fixed_price=x.fixed_price) for x in items]


