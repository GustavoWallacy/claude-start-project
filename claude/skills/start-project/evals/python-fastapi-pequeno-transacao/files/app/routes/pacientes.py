from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine
router = APIRouter()

@router.get("/{paciente_id}")
def obter(paciente_id: int):
    with engine.connect() as c:
        r = c.execute(text("SELECT id, nome, cpf FROM pacientes WHERE id = :id"), {"id": paciente_id}).first()
    return dict(r._mapping) if r else None
