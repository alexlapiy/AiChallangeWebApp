from sqlalchemy.orm import Session

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import Admin


class AdminRepository(SqlAlchemyRepository[Admin]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Admin)

    def getByLogin(self, login: str) -> Admin | None:
        return self.session.query(Admin).filter(Admin.login == login).first()


