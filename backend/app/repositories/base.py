from typing import Generic, Iterable, Optional, TypeVar

from sqlalchemy.orm import Session


T = TypeVar("T")


class SqlAlchemyRepository(Generic[T]):
    def __init__(self, session: Session, model: type[T]) -> None:
        self.session = session
        self.model = model

    def add(self, entity: T) -> T:
        self.session.add(entity)
        return entity

    def getById(self, entity_id: int) -> Optional[T]:
        return self.session.get(self.model, entity_id)

    def listAll(self) -> Iterable[T]:
        return self.session.query(self.model).all()

    def deleteById(self, entity_id: int) -> None:
        obj = self.getById(entity_id)
        if obj is not None:
            self.session.delete(obj)


