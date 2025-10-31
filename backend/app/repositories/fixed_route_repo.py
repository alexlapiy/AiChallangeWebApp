from sqlalchemy.orm import Session

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import FixedRoute


class FixedRouteRepository(SqlAlchemyRepository[FixedRoute]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, FixedRoute)

    def find(self, from_city: str, to_city: str) -> FixedRoute | None:
        return (
            self.session.query(FixedRoute)
            .filter(FixedRoute.from_city == from_city, FixedRoute.to_city == to_city)
            .first()
        )


