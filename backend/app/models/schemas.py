from pydantic import BaseModel, Field
from typing import List, Optional


class DIYIdea(BaseModel):
    title: str
    description: str
    materials: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    difficulty: Optional[str] = None
    estimated_time_minutes: Optional[int] = None


class ModelAsset(BaseModel):
    model_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    format: Optional[str] = None  # e.g., glb, obj, fbx


class GenerateResponse(BaseModel):
    model: ModelAsset
    ideas: List[DIYIdea]

