from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    login: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    admin_id: int

