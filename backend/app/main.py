from __future__ import annotations

import asyncio
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import settings
from .models.schemas import GenerateResponse, ModelAsset, DIYIdea
from .services.tripo import TripoClient
from .services.gemini import generate_diy_ideas


app = FastAPI(title="DIY Upcycler Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "env": settings.env,
        "gemini_model_config": settings.gemini_model,
        "mock": {
            "external": settings.mock_external,
            "gemini": settings.mock_gemini,
            "tripo": settings.mock_tripo,
        },
    }


@app.get("/v1/gemini/models")
async def list_gemini_models():
    try:
        import google.generativeai as genai
        if not settings.gemini_api_key:
            return {"error": "GEMINI_API_KEY not configured"}
        genai.configure(api_key=settings.gemini_api_key)
        items = []
        for m in genai.list_models():
            items.append({
                "name": getattr(m, "name", None),
                "supported_generation_methods": getattr(m, "supported_generation_methods", None),
            })
        return {"models": items}
    except Exception as e:
        return {"error": str(e)}


@app.post("/v1/generate", response_model=GenerateResponse)
async def generate(
    description: str = Form(..., description="Additional useful info such as materials, condition, etc."),
    images: List[UploadFile] | None = File(
        None, description="Zero or more images; required only when generate_model=true"
    ),
    generate_model: bool = Form(False, description="Whether to generate 3D model via Tripo (token cost)"),
):
    if generate_model and not images:
        raise HTTPException(status_code=400, detail="At least one image is required when generate_model=true")

    ideas_task = asyncio.create_task(asyncio.to_thread(generate_diy_ideas, description))

    if generate_model:
        # Read image bytes only if we actually generate 3D
        img_payload = []
        for uf in (images or []):
            content = await uf.read()
            if not content:
                raise HTTPException(status_code=400, detail=f"Empty upload: {uf.filename}")
            img_payload.append((uf.filename, content))

        tripo = TripoClient()
        model_task = asyncio.create_task(tripo.generate_from_images(img_payload))
        model_result, ideas_result = await asyncio.gather(model_task, ideas_task)
    else:
        # Skip Tripo call to save tokens
        ideas_result = await ideas_task
        model_result = {"model_url": None, "preview_image_url": None, "format": None}

    ideas: List[DIYIdea] = [DIYIdea(**i) for i in ideas_result.get("ideas", [])]

    return GenerateResponse(
        model=ModelAsset(**model_result),
        ideas=ideas,
    )


# Uvicorn entrypoint for Docker
def run():  # pragma: no cover
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.env == "development",
    )
