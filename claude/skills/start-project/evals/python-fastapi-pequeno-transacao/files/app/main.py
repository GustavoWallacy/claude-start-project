from fastapi import FastAPI
from app.routes import pacientes
app = FastAPI()
app.include_router(pacientes.router, prefix="/pacientes")
