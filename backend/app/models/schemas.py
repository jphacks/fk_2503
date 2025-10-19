from pydantic import BaseModel, Field
from typing import List, Optional, Union


class Step(BaseModel):
    text: str
    operation: Optional[str] = None  # 例: 貼り付ける/のりを塗る/切る/色を塗る/削る/その他


class DIYIdea(BaseModel):
    title: str
    description: str
    materials: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    # 後方互換のため、文字列/オブジェクト両方を許容
    steps: List[Union[str, Step]] = Field(default_factory=list)
    difficulty: Optional[str] = None
    estimated_time_minutes: Optional[int] = None


class ModelAsset(BaseModel):
    # Avoid Pydantic warning about protected namespace "model_"
    model_config = {"protected_namespaces": ()}
    model_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    format: Optional[str] = None  # e.g., glb, obj, fbx


class GenerateResponse(BaseModel):
    model: ModelAsset
    ideas: List[DIYIdea]
