from __future__ import annotations

from typing import List, Optional, Tuple

import httpx
from fastapi import HTTPException

from ..config import settings


class TripoClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.tripo_api_key
        # If not provided, leave empty; endpoint specifics must be configured by user.
        self.base_url = (base_url or settings.tripo_api_base or "").rstrip("/")

    async def generate_from_images(self, images: List[Tuple[str, bytes]]):
        """
        Generate a 3D model from one or more images.

        images: list of (filename, content_bytes)

        Returns a dict with keys: model_url, preview_image_url, format

        Notes:
        - The concrete Tripo API endpoint and payload format are not set here.
          Set TRIPO_API_BASE and adapt the code below to match your account's API.
        - When MOCK_EXTERNAL=1, returns placeholder URLs.
        """
        if settings.mock_tripo:
            return {
                "model_url": "https://example.com/mock/model.glb",
                "preview_image_url": "https://picsum.photos/seed/mock/512/512",
                "format": "glb",
            }

        if not self.api_key:
            raise HTTPException(status_code=500, detail="TRIPO_API_KEY not configured")

        if not self.base_url:
            raise HTTPException(
                status_code=501,
                detail=(
                    "Tripo API integration not configured. Set TRIPO_API_BASE and ITD paths."
                ),
            )

        headers = {"Authorization": f"Bearer {self.api_key}"}

        # Create ITD task (Image-To-3D). Path should come from docs/env.
        create_path = settings.tripo_create_path
        status_path_tmpl = settings.tripo_status_path
        if not create_path or not status_path_tmpl:
            raise HTTPException(
                status_code=501,
                detail=(
                    "TRIPO_ITD_CREATE_PATH/TRIPO_ITD_STATUS_PATH must be set per Tripo docs."
                ),
            )
        create_url = f"{self.base_url.rstrip('/')}/{create_path.lstrip('/')}"

        files = []
        for idx, (filename, content) in enumerate(images):
            files.append(("images", (filename or f"image_{idx}.jpg", content, "image/jpeg")))

        # Additional options can be added here per docs, e.g., 'format': 'glb'
        data = {}

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                resp = await client.post(create_url, headers=headers, files=files, data=data)
                resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=e.response.status_code, detail=f"Tripo error: {e.response.text}")
            except Exception as e:  # pragma: no cover - network path
                raise HTTPException(status_code=502, detail=f"Tripo request failed: {e}")

        payload = resp.json()

        # If API returns direct assets immediately, map and return.
        direct_model_url = (
            payload.get("model_url")
            or payload.get("assets", {}).get("glb")
            or payload.get("glb")
            or payload.get("model_glb")
        )
        if direct_model_url:
            preview_url = payload.get("preview_image_url") or payload.get("preview")
            fmt = "glb" if direct_model_url.endswith(".glb") else payload.get("format")
            return {"model_url": direct_model_url, "preview_image_url": preview_url, "format": fmt}

        # Otherwise treat as async job and poll by task id
        task_id = payload.get("task_id") or payload.get("id") or payload.get("data", {}).get("id")
        if not task_id:
            raise HTTPException(status_code=502, detail="Tripo response missing task id and model url")

        status_url = f"{self.base_url.rstrip('/')}/{status_path_tmpl.lstrip('/')}".format(task_id=task_id, id=task_id)

        # Polling loop
        import time

        deadline = time.time() + settings.tripo_poll_timeout
        success_states = {"succeeded", "success", "completed", "done"}
        fail_states = {"failed", "error", "canceled", "cancelled"}

        async with httpx.AsyncClient(timeout=60) as client:
            while True:
                if time.time() > deadline:
                    raise HTTPException(status_code=504, detail="Tripo polling timed out")
                try:
                    sresp = await client.get(status_url, headers=headers)
                    sresp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    raise HTTPException(status_code=e.response.status_code, detail=f"Tripo status error: {e.response.text}")
                except Exception as e:  # pragma: no cover
                    raise HTTPException(status_code=502, detail=f"Tripo status request failed: {e}")

                sjson = sresp.json()
                status = (
                    sjson.get("status")
                    or sjson.get("state")
                    or sjson.get("data", {}).get("status")
                )

                # Extract URLs if present
                model_url = (
                    sjson.get("model_url")
                    or sjson.get("assets", {}).get("glb")
                    or sjson.get("result", {}).get("glb")
                    or sjson.get("glb")
                    or sjson.get("model_glb")
                )
                preview_url = (
                    sjson.get("preview_image_url")
                    or sjson.get("preview")
                    or sjson.get("thumbnail")
                )

                if status and str(status).lower() in fail_states:
                    detail = sjson.get("message") or sjson
                    raise HTTPException(status_code=502, detail=f"Tripo job failed: {detail}")

                # Some APIs include result before a final status; prioritize explicit success
                if model_url and (not status or str(status).lower() in success_states):
                    fmt = "glb" if model_url.endswith(".glb") else sjson.get("format")
                    return {"model_url": model_url, "preview_image_url": preview_url, "format": fmt}

                # Not ready yet
                await asyncio.sleep(settings.tripo_poll_interval)
