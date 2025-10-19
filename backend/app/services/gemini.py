from __future__ import annotations

from typing import List

from fastapi import HTTPException

from ..config import settings
import json
import re


def _format_prompt(description: str) -> str:
    return (
        "あなたは創造的なDIYアシスタントです。以下の廃材・素材の説明を読み、"
        "アップサイクルのDIYアイデアを日本語で3案提案してください。各アイデアについて、"
        "短い日本語タイトル、1段落の日本語説明、材料（できるだけ提示された素材を再利用）、工具、"
        "6〜10個の手順を返してください。手順は配列で、各ステップは{text, operation}のオブジェクトです。"
        "operation は必ず次のいずれか: 『貼り付ける』『のりを塗る』『切る』『色を塗る』『削る』『その他』。"
        "text は小学生でも分かる短い命令文で、材料名・工具名を具体的に書いてください。"
        "難易度（Easy/Medium/Hard）と、およその所要時間（分）も含めてください。"
        "応答は次の形式のJSONのみを返してください（文章やコードフェンスは禁止）。\n"
        "{\n  \"ideas\": [\n    {\n      \"title\": string,\n      \"description\": string,\n      \"materials\": string[],\n      \"tools\": string[],\n      \"steps\": [{\n        \"text\": string,\n        \"operation\": \"貼り付ける\" | \"のりを塗る\" | \"切る\" | \"色を塗る\" | \"削る\" | \"その他\"\n      }],\n      \"difficulty\": string,\n      \"estimated_time_minutes\": number\n    }\n  ]\n}\n"
        f"\n素材の説明: {description}\n"
    )


def _extract_json(text: str) -> dict:
    """Extract JSON object from a Gemini response, tolerating fenced code blocks.

    - Strips ```json ... ``` fences
    - Trims leading/trailing text outside the outermost JSON braces
    """
    if not text:
        raise ValueError("Empty response text")

    # Remove markdown code fences if present
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    # Try direct parse first
    try:
        return json.loads(text)
    except Exception:
        pass

    # Extract between first { and last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start : end + 1]
        return json.loads(candidate)

    # Give up
    return json.loads(text)


def _sanitize_json_like(text: str) -> str:
    """Try to coerce common near-JSON into strict JSON.

    - Replace smart quotes with straight quotes
    - Remove trailing commas before } or ]
    - Strip code fences (defensive)
    """
    if not text:
        return text
    t = text.strip()
    # Code fences
    t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\s*```$", "", t)
    # Smart quotes → ASCII quotes
    t = t.replace("\u201c", '"').replace("\u201d", '"').replace("\u2018", "'").replace("\u2019", "'")
    t = t.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    # Remove trailing commas before } or ]
    t = re.sub(r",\s*(\}|\])", r"\1", t)
    return t


def _repair_json_with_gemini(raw_text: str, model) -> dict:
    """Ask Gemini to fix to strict JSON per schema if initial parse failed."""
    instruction = (
        "以下のテキストは本来JSONであるべきですが、形式が崩れています。"
        "次のスキーマに一致する有効なJSONだけを返してください（余計な説明やコードフェンス、改行前後のテキストは禁止）。\n"
        "{\n  \"ideas\": [\n    {\n      \"title\": string,\n      \"description\": string,\n      \"materials\": string[],\n      \"tools\": string[],\n      \"steps\": string[],\n      \"difficulty\": string,\n      \"estimated_time_minutes\": number\n    }\n  ]\n}\n"
        "元テキスト:\n" + raw_text
    )
    try:
        fixed = model.generate_content(instruction)
        text = getattr(fixed, "text", None) or ""
        text = _sanitize_json_like(text)
        return _extract_json(text)
    except Exception as e:
        raise e


def generate_diy_ideas(description: str) -> dict:
    """
    Generate multiple DIY ideas with steps using Gemini.

    Returns a dict compatible with models.schemas.GenerateResponse.ideas
    """
    if settings.mock_gemini:
        return {
            "ideas": [
                {
                    "title": "Planter from Plastic Bottle",
                    "description": "Turn a discarded plastic bottle into a small herb planter.",
                    "materials": ["1.5L plastic bottle", "potting soil", "herb seeds"],
                    "tools": ["scissors", "marker", "sandpaper"],
                    "steps": [
                        {"text": "ボトルの側面に窓の形をマーカーで描く", "operation": "その他"},
                        {"text": "描いた線に沿ってはさみで切る", "operation": "切る"},
                        {"text": "切り口を紙やすりでなめらかにする", "operation": "削る"},
                        {"text": "底に水抜き穴を数カ所あける", "operation": "その他"},
                        {"text": "土を入れて種をまく", "operation": "その他"},
                    ],
                    "difficulty": "Easy",
                    "estimated_time_minutes": 30,
                },
                {
                    "title": "Cardboard Desk Organizer",
                    "description": "Upcycle sturdy cardboard into a multi-slot desk organizer.",
                    "materials": ["corrugated cardboard", "glue", "decorative paper"],
                    "tools": ["box cutter", "ruler", "cutting mat"],
                    "steps": [
                        {"text": "ベースと仕切りを定規で測ってカッターで切る", "operation": "切る"},
                        {"text": "仕切りを土台にのりで貼り付ける", "operation": "貼り付ける"},
                        {"text": "上部にペン用の小さな仕切りを追加する", "operation": "その他"},
                        {"text": "外側をデコ紙で包んでのりを塗る", "operation": "のりを塗る"},
                        {"text": "乾かして完成", "operation": "その他"},
                    ],
                    "difficulty": "Medium",
                    "estimated_time_minutes": 45,
                },
                {
                    "title": "Tin Can Lantern",
                    "description": "Repurpose a tin can into a pierced pattern lantern.",
                    "materials": ["clean tin can", "tea light candle"],
                    "tools": ["hammer", "nail", "marker"],
                    "steps": [
                        {"text": "缶に水を入れて凍らせ、側面を固くする", "operation": "その他"},
                        {"text": "点の模様をマーカーで描く", "operation": "その他"},
                        {"text": "釘とハンマーで点を穴あけする", "operation": "切る"},
                        {"text": "氷を溶かして缶を乾かす", "operation": "その他"},
                        {"text": "中にキャンドルを入れて光らせる", "operation": "その他"},
                    ],
                    "difficulty": "Easy",
                    "estimated_time_minutes": 40,
                },
            ]
        }

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        import google.generativeai as genai
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Gemini SDK not available: {e}")

    genai.configure(api_key=settings.gemini_api_key)

    def _normalize(name: str) -> str:
        return name.replace("models/", "") if name else name

    preferred_norm = _normalize(settings.gemini_model or "")
    # Favor 2.x family first, then 1.5/1.x as fallbacks.
    fallback_candidates_norm = [
        preferred_norm,
        # 2.5 family (names may vary by account/region; list_models will filter)
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-pro-latest",
        "gemini-2.5-flash-latest",
        # 2.0 family
        "gemini-2.0-pro",
        "gemini-2.0-flash",
        "gemini-2.0-pro-exp",
        "gemini-2.0-flash-exp",
    ]

    chosen_full_name = None  # e.g., "models/gemini-1.5-flash-latest"
    try:
        available = list(genai.list_models())
        available_map = {}  # normalized -> full name
        for m in available:
            try:
                methods = set(getattr(m, "supported_generation_methods", []) or [])
                if "generateContent" in methods:
                    full = getattr(m, "name", "")
                    n = _normalize(full)
                    if n and full:
                        available_map[n] = full
            except Exception:
                continue
        for cand in fallback_candidates_norm:
            if cand and cand in available_map:
                chosen_full_name = available_map[cand]
                break
        # If none matched, pick the first available model supporting generateContent
        if not chosen_full_name and available_map:
            chosen_full_name = next(iter(available_map.values()))
    except Exception:
        # If listing fails, just take the first non-empty candidate string
        for cand in fallback_candidates_norm:
            if cand:
                chosen_full_name = cand  # SDK accepts both with or without "models/"
                break

    if not chosen_full_name:
        chosen_full_name = "gemini-1.5-flash-latest"

    gen_cfg = {
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 32,
        "max_output_tokens": 1536,
        "response_mime_type": "application/json",
    }

    # Some SDK versions or models might not accept response_schema; make it opt-in.
    if settings.gemini_use_schema:
        gen_cfg["response_schema"] = {
            "type": "object",
            "properties": {
                "ideas": {
                    "type": "array",
                    "minItems": 3,
                    "maxItems": 3,
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "materials": {"type": "array", "items": {"type": "string"}},
                            "tools": {"type": "array", "items": {"type": "string"}},
                            "steps": {"type": "array", "minItems": 6, "maxItems": 10, "items": {"type": "string"}},
                            "difficulty": {"type": "string"},
                            "estimated_time_minutes": {"type": "integer"},
                        },
                        "required": [
                            "title",
                            "description",
                            "materials",
                            "tools",
                            "steps",
                            "difficulty",
                            "estimated_time_minutes",
                        ],
                    },
                }
            },
            "required": ["ideas"],
        }

    # Create model, but gracefully fall back if response_schema isn't supported
    try:
        model = genai.GenerativeModel(
            model_name=chosen_full_name,
            generation_config=gen_cfg,
        )
    except Exception as e:
        # Some SDK versions raise on unknown schema fields (e.g., additionalProperties)
        # Remove schema and retry to avoid hard failure.
        if settings.gemini_use_schema and "Schema" in str(e):
            try:
                gen_cfg.pop("response_schema", None)
                model = genai.GenerativeModel(
                    model_name=chosen_full_name,
                    generation_config=gen_cfg,
                )
            except Exception:
                raise HTTPException(status_code=500, detail=f"Gemini model init failed: {e}")
        else:
            raise HTTPException(status_code=500, detail=f"Gemini model init failed: {e}")

    prompt = _format_prompt(description)
    try:
        response = model.generate_content(prompt)
    except Exception as e:  # pragma: no cover - network path
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {e}")

    # Prefer the SDK's text property; some SDK versions also expose .candidates JSON directly.
    data = getattr(response, "text", None) or ""
    # First attempt: direct parse with light extraction
    try:
        parsed = _extract_json(data)
        if "ideas" not in parsed or not isinstance(parsed["ideas"], list):
            raise ValueError("Missing 'ideas' list in Gemini response")
        return parsed
    except Exception:
        pass

    # Second attempt: sanitize common issues (trailing commas, smart quotes)
    try:
        sanitized = _sanitize_json_like(data)
        parsed = _extract_json(sanitized)
        if "ideas" not in parsed or not isinstance(parsed["ideas"], list):
            raise ValueError("Missing 'ideas' list in Gemini response")
        return parsed
    except Exception:
        pass

    # Final attempt: ask Gemini to strictly reformat to JSON
    try:
        repaired = _repair_json_with_gemini(data, model)
        if "ideas" not in repaired or not isinstance(repaired["ideas"], list):
            raise ValueError("Missing 'ideas' list in repaired JSON")
        return repaired
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse Gemini JSON: {e}")
