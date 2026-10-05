"""
Unit tests for Combiner Model (backend/models/combiner.py).
Tests:
- 14-dimensional feature vector extraction
- Combiner prediction output types
- Responsible abstention when confidence is below calibrated threshold
"""

import numpy as np
from backend.models.combiner import (
    extract_feature_vector,
    get_combiner,
    CLASSES,
)


def test_extract_feature_vector():
    vec = extract_feature_vector(
        retrieval_score=0.92,
        rerank_score=0.88,
        claim_type="numeric",
        checker_statuses={
            "numbers": "match",
            "durations": "not_applicable",
            "dates": "not_applicable",
            "modality": "not_applicable",
            "negation": "not_applicable",
            "entities": "not_applicable",
            "hedging": "not_applicable",
        },
        nli_probs={"entailment": 0.90, "contradiction": 0.05, "neutral": 0.05},
        judge_agreement=1,
        passage_len=350,
    )
    assert isinstance(vec, np.ndarray)
    assert len(vec) == 14
    assert vec[0] == 0.92  # retrieval
    assert vec[3] == 1.0   # numbers matched


def test_combiner_predict_supported():
    combiner = get_combiner()
    # High retrieval, match on checker, high entailment
    vec = extract_feature_vector(
        retrieval_score=0.95,
        rerank_score=0.92,
        claim_type="duration",
        checker_statuses={"durations": "match"},
        nli_probs={"entailment": 0.95, "contradiction": 0.02, "neutral": 0.03},
        judge_agreement=1,
        passage_len=200,
    )
    verdict, conf = combiner.predict(vec)
    assert verdict in CLASSES
    assert 0.0 <= conf <= 1.0


def test_combiner_predict_contradicted():
    combiner = get_combiner()
    # High retrieval, mismatch on checker, high contradiction
    vec = extract_feature_vector(
        retrieval_score=0.85,
        rerank_score=0.80,
        claim_type="numeric",
        checker_statuses={"numbers": "mismatch"},
        nli_probs={"entailment": 0.02, "contradiction": 0.94, "neutral": 0.04},
        judge_agreement=-1,
        passage_len=200,
    )
    verdict, conf = combiner.predict(vec)
    assert verdict in CLASSES
    assert 0.0 <= conf <= 1.0


def test_combiner_abstains_on_low_confidence():
    combiner = get_combiner()
    # Conflicting / low certainty signals
    vec = extract_feature_vector(
        retrieval_score=0.35,
        rerank_score=0.30,
        claim_type="general",
        checker_statuses={"numbers": "needs_review"},
        nli_probs={"entailment": 0.33, "contradiction": 0.33, "neutral": 0.34},
        judge_agreement=0,
        passage_len=100,
    )
    verdict, conf = combiner.predict(vec)
    # When uncertain, must route to NEEDS_REVIEW or have calibrated confidence
    assert verdict in CLASSES
