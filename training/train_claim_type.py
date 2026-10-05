"""
Train Claim Type Classifier for TRACE.
TF-IDF + Logistic Regression baseline that classifies claim text into:
numeric, date, duration, entity, modal, negation, causal, general.

Run with:
    python -m training.train_claim_type
"""

import os
import sys

# Ensure repository root is on sys.path so script can be run directly or as a module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report

from backend.models.claim_type import TRAINING_SAMPLES, MODEL_PATH, CLAIM_TYPES


def train_claim_type_classifier():
    print("=" * 60)
    print("Training TRACE Claim Type Classifier (TF-IDF + Logistic Regression)")
    print("=" * 60)

    # Expanded training dataset with diverse phrasing
    additional_samples = [
        # numeric
        ("Annual subscription costs $12,000 billed quarterly.", "numeric"),
        ("The server cluster contains 64 physical nodes.", "numeric"),
        ("Total damages awarded amounted to 10 crore rupees.", "numeric"),
        ("Employee headcount reached 500 across three offices.", "numeric"),
        ("Operating margins increased to 18.2% in fiscal 2024.", "numeric"),
        ("Late payment surcharge of ₹1,500 applies after due date.", "numeric"),
        ("Cloud storage allocation is capped at 10 terabytes.", "numeric"),
        
        # date
        ("The lease agreement commenced on 1st September 2023.", "date"),
        ("Quarterly compliance reports are due by 2025-06-30.", "date"),
        ("The board meeting occurred on November 12, 2023.", "date"),
        ("Patent expires on the 14th of February 2030.", "date"),
        ("The initial audit began in July 2021.", "date"),
        ("Effective closing date was 2024-03-31.", "date"),
        
        # duration
        ("Warranty protection covers parts for 3 years.", "duration"),
        ("Customer has thirty (30) business days to review deliverables.", "duration"),
        ("The cure period for breach is 15 calendar days.", "duration"),
        ("Service SLA guarantees response within 4 hours.", "duration"),
        ("Consulting engagement is scheduled for 6 months.", "duration"),
        ("Cancellation notice must be delivered forty-five days prior.", "duration"),
        
        # entity
        ("Microsoft Azure provides cloud hosting infrastructure.", "entity"),
        ("Acme Technologies Pvt Ltd is the designated contractor.", "entity"),
        ("The Buyer accepts title upon delivery of goods.", "entity"),
        ("Deloitte Touche Tohmatsu conducted the statutory audit.", "entity"),
        ("The Service Provider will indemnify the Customer.", "entity"),
        
        # modal
        ("The tenant shall maintain the premises in good condition.", "modal"),
        ("Licensee may sublicense the technology with prior consent.", "modal"),
        ("All employees must complete mandatory ethics training.", "modal"),
        ("The insurer will pay approved claims within thirty days.", "modal"),
        ("Clients can request customized reports at any time.", "modal"),
        ("The carrier is obligated to safeguard all freight.", "modal"),
        
        # negation
        ("The supplier makes no express or implied warranties.", "negation"),
        ("Neither party excludes liability for gross negligence.", "negation"),
        ("Access is granted without any administrative privileges.", "negation"),
        ("Unless authorized in writing, reproduction is prohibited.", "negation"),
        ("Under no circumstances shall penalties exceed the cap.", "negation"),
        ("Except for emergency repairs, all work requires notice.", "negation"),
        
        # causal
        ("Failure to deliver causes contract termination.", "causal"),
        ("System downtime was caused by hardware failure.", "causal"),
        ("Breach of confidentiality leads to injunctive relief.", "causal"),
        ("Because the milestone failed, funding was cancelled.", "causal"),
        ("Network congestion resulted in high packet loss.", "causal"),
        
        # general
        ("The architecture follows best practices in microservices.", "general"),
        ("All communications are encrypted using standard protocols.", "general"),
        ("Documentation is available on the internal portal.", "general"),
        ("The team holds daily standup meetings at 10 AM.", "general"),
        ("The system logs all administrative actions automatically.", "general"),
    ]

    all_samples = TRAINING_SAMPLES + additional_samples
    texts = [t for t, y in all_samples]
    labels = [y for t, y in all_samples]

    print(f"Total training examples: {len(all_samples)}")
    print(f"Target classes ({len(CLAIM_TYPES)}): {', '.join(CLAIM_TYPES)}")

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, token_pattern=r"(?u)\b\w+\b|[%$₹€£]")),
        ("clf", LogisticRegression(max_iter=500, C=3.0, class_weight="balanced", random_state=42)),
    ])

    # 5-fold cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, texts, labels, cv=cv, scoring="accuracy")
    print(f"\n5-Fold Cross-Validation Accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")

    # Fit on all data
    pipeline.fit(texts, labels)
    preds = pipeline.predict(texts)
    print("\nTraining Set Classification Report:")
    print(classification_report(labels, preds, target_names=sorted(list(set(labels)))))

    # Save artifact
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")

    # Test sample predictions
    test_cases = [
        "Invoices shall be paid within thirty (30) business days.",
        "Supplier liability cannot exceed $50,000 under any terms.",
        "The effective commencement date is January 15, 2024.",
        "Neither party shall disclose confidential data.",
        "Acme Corp acquired the intellectual property.",
    ]
    print("\nSample Predictions:")
    for tc in test_cases:
        pred = pipeline.predict([tc])[0]
        print(f"  \"{tc}\" -> [{pred}]")


if __name__ == "__main__":
    train_claim_type_classifier()
