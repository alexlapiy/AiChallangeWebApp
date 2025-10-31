from sqlalchemy.orm import Session

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import User


class UserRepository(SqlAlchemyRepository[User]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, User)


