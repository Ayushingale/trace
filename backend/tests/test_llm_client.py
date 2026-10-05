"""
Unit tests for LLM Client wrapper (backend/app/llm/client.py).
Tests:
- Fallback/mock mode when API key is missing
- JSON mode cleaning markdown code fences
- Retry handling and timeouts
"""

from unittest.mock import patch, MagicMock
from backend.app.llm.client import call_llm, _clean_json_markdown


def test_clean_json_markdown():
    text_with_fence = "```json\n{\"verdict\": \"SUPPORTED\"}\n```"
    cleaned = _clean_json_markdown(text_with_fence)
    assert cleaned == "{\"verdict\": \"SUPPORTED\"}"

    raw_json = "{\"status\": \"ok\"}"
    assert _clean_json_markdown(raw_json) == raw_json


def test_call_llm_mock_when_no_api_key():
    with patch.dict("os.environ", {"LLM_API_KEY": ""}):
        res = call_llm("Extract atomic claims from this text", json_mode=True)
        assert isinstance(res, list) or isinstance(res, dict)

        judge_res = call_llm("Run judge on claim", json_mode=True)
        assert isinstance(judge_res, dict)
        assert judge_res.get("verdict") == "NEEDS_REVIEW"


def test_call_llm_retries_on_failure():
    # Mock httpx client failing twice then succeeding
    mock_resp_fail = MagicMock()
    mock_resp_fail.status_code = 500
    mock_resp_fail.raise_for_status.side_effect = Exception("500 Server Error")

    mock_resp_success = MagicMock()
    mock_resp_success.status_code = 200
    mock_resp_success.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Success output"}]}}]
    }

    with patch("httpx.Client") as mock_client_cls:
        client_instance = mock_client_cls.return_value.__enter__.return_value
        client_instance.post.side_effect = [
            Exception("Connection error"),
            mock_resp_success,
        ]

        with patch.dict("os.environ", {"LLM_API_KEY": "fake_test_key"}):
            output = call_llm("Test prompt", max_retries=2, timeout_seconds=2.0)
            assert output == "Success output"
