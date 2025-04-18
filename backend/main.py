from fastapi import FastAPI
from app.routes.predict import router as predict_router
from app.routes.stability import router as stability_router
from app.routes.reminders import router as reminders_router
from app.routes.assistant import router as assistant_router




app = FastAPI()

app.include_router(predict_router)
app.include_router(stability_router)
app.include_router(reminders_router)
app.include_router(assistant_router)


