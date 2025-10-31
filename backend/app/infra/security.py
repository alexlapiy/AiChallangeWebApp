from passlib.context import CryptContext


pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hashPassword(password: str) -> str:
    return pwd_ctx.hash(password)


def verifyPassword(password: str, password_hash: str) -> bool:
    return pwd_ctx.verify(password, password_hash)


