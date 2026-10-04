"""
NLI (Natural Language Inference) Module.
Estimates entailment, contradiction, and neutral probabilities between
a claim (hypothesis) and source evidence (premise).
Supports transformer models when available, with a fast fallback
lexical and semantic overlap estimator.
"""

import logging
from typing import Dict, Optional
from rapidfuzz import fuzz

logger = logging.getLogger("trace.models.nli")


class NLIModel:
    def __init__(self, model_name: str = "cross-encoder/nli-deberta-v3-mini"):
        self.model_name = model_name
        self._pipeline = None
        self._initialized = False

    def _init_pipeline(self):
        if self._initialized:
            return
        self._initialized = True
        try:
            from transformers import pipeline
            self._pipeline = pipeline("text-classification", model=self.model_name, top_k=None)
            logger.info(f"Loaded NLI model: {self.model_name}")
        except Exception as e:
            logger.info(f"Using rule/heuristic NLI scorer (transformers not initialized: {e})")

    def predict_proba(self, premise: str, hypothesis: str) -> Dict[str, float]:
        """
        Calculates probabilities for entailment, contradiction, and neutral.
        """
        self._init_pipeline()

        if self._pipeline is not None:
            try:
                # Transformers text-classification pipeline
                inputs = f"{premise} [SEP] {hypothesis}"
                outputs = self._pipeline(inputs)[0]
                res = {"entailment": 0.33, "contradiction": 0.33, "neutral": 0.34}
                for item in outputs:
                    lbl = item["label"].lower()
                    if "entail" in lbl:
                        res["entailment"] = float(item["score"])
                    elif "contra" in lbl:
                        res["contradiction"] = float(item["score"])
                    elif "neut" in lbl:
                        res["neutral"] = float(item["score"])
                return res
            except Exception as e:
                logger.warning(f"Transformer NLI inference failed: {e}")

        # High-precision heuristic fallback based on lexical & semantic features
        premise_lower = premise.lower()
        hyp_lower = hypothesis.lower()

        # Token overlap
        overlap_score = fuzz.token_set_ratio(premise_lower, hyp_lower) / 100.0

        # Check for obvious negation contradiction
        has_hyp_neg = any(w in hyp_lower.split() for w in ["not", "never", "no", "neither", "prohibited", "cannot"])
        has_prem_neg = any(w in premise_lower.split() for w in ["not", "never", "no", "neither", "prohibited", "cannot"])

        if has_hyp_neg != has_prem_neg and overlap_score > 0.6:
            # Likely contradiction
            p_contra = min(0.92, overlap_score + 0.1)
            p_entail = max(0.04, 1.0 - p_contra - 0.05)
            p_neut = 1.0 - p_contra - p_entail
        elif overlap_score > 0.8:
            # Strong entailment
            p_entail = min(0.95, overlap_score * 0.95)
            p_contra = 0.03
            p_neut = 1.0 - p_entail - p_contra
        elif overlap_score > 0.5:
            p_entail = overlap_score * 0.6
            p_contra = 0.15
            p_neut = 1.0 - p_entail - p_contra
        else:
            p_entail = 0.15
            p_contra = 0.15
            p_neut = 0.70

        return {
            "entailment": round(p_entail, 3),
            "contradiction": round(p_contra, 3),
            "neutral": round(p_neut, 3),
        }


_NLI_INSTANCE = None


def get_nli_model() -> NLIModel:
    global _NLI_INSTANCE
    if _NLI_INSTANCE is None:
        _NLI_INSTANCE = NLIModel()
    return _NLI_INSTANCE


def predict_nli(premise: str, hypothesis: str) -> Dict[str, float]:
    """Convenience wrapper for NLI prediction."""
    return get_nli_model().predict_proba(premise, hypothesis)
