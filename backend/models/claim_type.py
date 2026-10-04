"""
Claim Type Classifier.
TF-IDF + Logistic Regression baseline that classifies claim text into:
numeric, date, duration, entity, modal, negation, causal, general.
Used to route claims to appropriate deterministic and semantic checkers.
"""

import os
import re
from typing import Dict, List, Optional, Tuple
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "artifacts", "claim_type_model.joblib")

CLAIM_TYPES = [
    "numeric",
    "date",
    "duration",
    "entity",
    "modal",
    "negation",
    "causal",
    "general",
]

# High quality seed dataset for training baseline classifier
TRAINING_SAMPLES = [
    # numeric
    ("The total license fee payable is $50,000.", "numeric"),
    ("The company revenue increased by 25 percent in Q3.", "numeric"),
    ("Maximum liability is capped at 1.5 million USD.", "numeric"),
    ("The penalty fee shall be ₹5,000 per violation.", "numeric"),
    ("Interest rate is fixed at 8.5% per annum.", "numeric"),
    ("Supplier delivered ten servers to the site.", "numeric"),
    ("Contract value exceeds 5 crore rupees.", "numeric"),
    ("The client shall pay 50 lakh upfront.", "numeric"),
    
    # date
    ("The agreement was executed on January 15, 2024.", "date"),
    ("The renewal date is the 31st of March 2025.", "date"),
    ("All filings must be submitted by 2024-12-31.", "date"),
    ("The policy took effect on 1st April 2023.", "date"),
    ("The audit concluded in October 2022.", "date"),
    ("The milestone deadline is 15th August 2024.", "date"),
    ("Effective date of the amendment is May 10, 2023.", "date"),

    # duration
    ("The contract term is for 24 months.", "duration"),
    ("Invoices are payable within 30 days of receipt.", "duration"),
    ("Notice of termination requires sixty (60) days.", "duration"),
    ("The warranty covers repairs for a period of 2 years.", "duration"),
    ("Support tickets are resolved within 24 hours.", "duration"),
    ("Notice must be given 3 business days prior.", "duration"),
    ("Delivery shall occur within forty-five days.", "duration"),

    # entity
    ("Acme Corp is the registered patent holder.", "entity"),
    ("Alpha Logistics Pvt Ltd acquired Beta Shipping.", "entity"),
    ("The Vendor shall deliver the software directly.", "entity"),
    ("International Business Machines LLC is party to this agreement.", "entity"),
    ("The Supplier retains ownership of intellectual property.", "entity"),
    ("Stanford University published the trial results.", "entity"),

    # modal
    ("The licensee shall comply with export restrictions.", "modal"),
    ("Either party may terminate without cause.", "modal"),
    ("The contractor must maintain active liability insurance.", "modal"),
    ("The customer will cooperate during the audit.", "modal"),
    ("Employees can access remote servers optionally.", "modal"),
    ("Parties are obligated to maintain strict confidentiality.", "modal"),

    # negation
    ("Neither party excludes liability for intentional breach.", "negation"),
    ("No refund shall be provided under any circumstances.", "negation"),
    ("The seller is not liable for indirect or consequential damages.", "negation"),
    ("Without prior written approval, no assignment is valid.", "negation"),
    ("Except as provided herein, all warranties are disclaimed.", "negation"),
    ("The software is provided without any guarantees.", "negation"),

    # causal
    ("Failure to pay causes immediate suspension of services.", "causal"),
    ("The security breach resulted from an unpatched vulnerability.", "causal"),
    ("Delay in delivery leads to liquidated damages.", "causal"),
    ("Because the milestone was missed, payment was withheld.", "causal"),
    ("Extreme weather conditions caused project postponement.", "causal"),

    # general
    ("The software functions as described in user documentation.", "general"),
    ("Employees undergo security training annually.", "general"),
    ("The architecture adopts microservices principles.", "general"),
    ("The dataset includes public benchmark images.", "general"),
    ("This section governs standard operational definitions.", "general"),
]


class ClaimTypeClassifier:
    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self._load_or_train()

    def _train(self):
        X = [text for text, label in TRAINING_SAMPLES]
        y = [label for text, label in TRAINING_SAMPLES]

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, token_pattern=r"(?u)\b\w+\b|[%$₹]")),
            ("clf", LogisticRegression(max_iter=300, C=2.0, class_weight="balanced")),
        ])
        pipeline.fit(X, y)
        self.pipeline = pipeline

        try:
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            joblib.dump(pipeline, MODEL_PATH)
        except Exception:
            pass

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                return
            except Exception:
                pass
        self._train()

    def classify(self, text: str) -> str:
        # Heuristic fast-path rules
        lower = text.lower()
        if re.search(r"\b(shall not|must not|cannot|neither|nor|without|except|unless|excludes?)\b", lower):
            return "negation"
        if re.search(r"\b(business days?|calendar days?|months?|weeks?|hours?|years?)\b", lower) and re.search(r"\d+|\b(thirty|sixty|twenty|ten)\b", lower):
            return "duration"
        if re.search(r"[%$₹€£]|inr|usd|crore|lakh|million|billion|\b\d+(?:,\d+)*(?:\.\d+)?\b", lower):
            return "numeric"
        if re.search(r"\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{4}-\d{2}-\d{2})\b", lower):
            return "date"
        if re.search(r"\b(shall|must|may|will|can|obligated|entitled)\b", lower):
            return "modal"

        if self.pipeline:
            try:
                return str(self.pipeline.predict([text])[0])
            except Exception:
                pass
        return "general"


_CLASSIFIER_INSTANCE = None


def get_claim_type_classifier() -> ClaimTypeClassifier:
    global _CLASSIFIER_INSTANCE
    if _CLASSIFIER_INSTANCE is None:
        _CLASSIFIER_INSTANCE = ClaimTypeClassifier()
    return _CLASSIFIER_INSTANCE


def classify_claim_type(claim_text: str) -> str:
    """Classifies a claim into one of the 8 canonical claim types."""
    return get_claim_type_classifier().classify(claim_text)
