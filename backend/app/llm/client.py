"""
TRACE LLM Client wrapper.
Supports API key from environment, exponential backoff retries, timeouts,
and optional JSON response parsing.
"""

import json
import logging
import os
import re
import time
from typing import Any, Dict, Optional, Union
import httpx
from backend.app.config import settings

logger = logging.getLogger("trace.llm.client")


def _clean_json_markdown(text: str) -> str:
    """Strip markdown code fence if present."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


def call_llm(
    prompt: str,
    system_instruction: Optional[str] = None,
    json_mode: bool = False,
    model: Optional[str] = None,
    temperature: float = 0.0,
    max_retries: int = 3,
    timeout_seconds: float = 20.0,
) -> Union[str, Dict[str, Any], list]:
    """
    Unified LLM caller with retries, timeouts, and JSON parsing.
    Reads LLM_API_KEY and LLM_MODEL from config/environment.
    If no key is configured, provides a mock response for deterministic testing.
    """
    api_key = os.environ.get("LLM_API_KEY") or settings.LLM_API_KEY
    model_name = model or os.environ.get("LLM_MODEL") or settings.LLM_MODEL or "gemini-2.5-flash"

    # Mock mode when API key is missing or explicitly mocked
    if not api_key:
        logger.warning("No LLM_API_KEY found in environment. Using deterministic fallback/mock response.")
        if json_mode:
            # Check prompt context for fallback responses
            if "atomic claims" in prompt.lower():
                return [
                    {
                        "claim_text": prompt.split("\n")[-1].strip() or "Mock extracted claim.",
                        "char_start": 0,
                        "char_end": min(len(prompt), 30),
                        "claim_type": "general",
                    }
                ]
            if "judge" in prompt.lower():
                return {
                    "verdict": "NEEDS_REVIEW",
                    "quote_from_passage": "",
                    "reasoning": "LLM_API_KEY missing - abstaining to human review.",
                }
            return {"status": "ok", "mock": True}
        return "TRACE Mock LLM output."

    # Gemini REST API implementation via httpx
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    
    payload: Dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
        },
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    if json_mode:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    last_error: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    res_data = response.json()
                    candidates = res_data.get("candidates", [])
                    if not candidates:
                        raise ValueError("No candidates returned from LLM")
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    raw_text = content_parts[0].get("text", "") if content_parts else ""
                    
                    if json_mode:
                        cleaned = _clean_json_markdown(raw_text)
                        try:
                            return json.loads(cleaned)
                        except json.JSONDecodeError as jde:
                            logger.error(f"Failed to parse JSON response: {cleaned} - {jde}")
                            raise
                    return raw_text
                else:
                    logger.warning(f"LLM API returned status {response.status_code}: {response.text}")
                    response.raise_for_status()
        except Exception as e:
            last_error = e
            logger.warning(f"LLM attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                time.sleep(1.0 * (2 ** (attempt - 1)))

    logger.error(f"All {max_retries} LLM attempts failed. Error: {last_error}")
    if json_mode:
        return {"error": str(last_error)}
    return f"Error calling LLM: {last_error}"
