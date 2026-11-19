import os, jwt
def validar(token: str) -> dict:
    return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
