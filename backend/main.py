from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv

# This securely unlocks your .env vault
load_dotenv()

# ai.py looks for AI_LLM_URL / AI_LLM_KEY to make live LLM calls (it makes a
# raw HTTPS request itself, no openai SDK needed). Point those at OpenAI using
# whatever key is in .env, unless someone has already set them explicitly.
os.environ.setdefault("AI_LLM_URL", "https://api.openai.com/v1")
if os.getenv("OPENAI_API_KEY") and not os.getenv("AI_LLM_KEY"):
    os.environ["AI_LLM_KEY"] = os.environ["OPENAI_API_KEY"]

import threading

import seed
from auth import router as auth_router
from db import get_db
from routes import router as api_router
from apscheduler.schedulers.background import BackgroundScheduler
from hazards import fetch_live_disasters

# Create the engine and set the 30-minute timer
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_live_disasters, "interval", minutes=30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed.seed_all(get_db())
    # Fetch once immediately (off the event loop) so the GDACS feed isn't
    # empty for the first 30 minutes after boot, then keep it refreshing.
    threading.Thread(target=fetch_live_disasters, daemon=True).start()
    scheduler.start()
    yield


app = FastAPI(
    title="Aegis Command API",
    description="Hazard Red Zone Identification Platform — backend",
    version="4.2.1",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8010)