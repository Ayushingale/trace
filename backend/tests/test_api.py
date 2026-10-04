"""
API endpoint tests for TRACE backend.
"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_documents_upload_mock():
    response = client.post("/documents")
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert len(data["job_id"]) > 0


def test_ask_endpoint():
    # First create job
    upload_res = client.post("/documents")
    job_id = upload_res.json()["job_id"]

    res = client.post("/ask", json={"question": "What is the duration?", "job_id": job_id})
    assert res.status_code == 200
    data = res.json()
    assert "answer_sentences" in data
    assert isinstance(data["answer_sentences"], list)
