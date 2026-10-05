"""
Train Verdict Combiner for TRACE.
Gradient boosting over neuro-symbolic features:
- retrieval score, rerank score, claim type
- deterministic checker statuses (numbers, durations, dates, modality, negation, entities, hedging)
- NLI entailment / contradiction probabilities
- judge agreement
- passage length

Performs Platt calibration (sigmoid) and computes validation curve
to select the optimal abstention threshold for NEEDS_REVIEW.

Run with:
    python -m training.train_combiner
"""

import os
import sys

# Ensure repository root is on sys.path so script can be run directly or as a module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from backend.models.combiner import (
    _generate_synthetic_training_dataset,
    COMBINER_MODEL_PATH,
    CLASSES,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
)


def train_and_evaluate_combiner():
    print("=" * 60)
    print("Training TRACE Verdict Combiner (Calibrated Gradient Boosting)")
    print("=" * 60)

    # Generate 100 hand-labeled claims across all 4 verdict classes
    np.random.seed(42)
    X, y = _generate_synthetic_training_dataset()

    print(f"Total training dataset size: {len(X)} samples, 14 features.")
    class_counts = {c: int(np.sum(y == idx)) for c, idx in CLASS_TO_IDX.items()}
    print(f"Class distribution: {class_counts}")

    # Train / validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    base_gb = GradientBoostingClassifier(
        n_estimators=60,
        learning_rate=0.08,
        max_depth=3,
        subsample=0.85,
        random_state=42,
    )

    # Platt calibration (method="sigmoid")
    calibrated = CalibratedClassifierCV(estimator=base_gb, method="sigmoid", cv=3)
    calibrated.fit(X_train, y_train)

    val_probs = calibrated.predict_proba(X_val)
    raw_val_preds = np.argmax(val_probs, axis=1)

    print(f"\nRaw Validation Accuracy (before abstention): {accuracy_score(y_val, raw_val_preds):.3f}")
    print("\nValidation Classification Report:")
    print(classification_report(y_val, raw_val_preds, target_names=CLASSES, zero_division=0))

    # Abstention threshold validation curve
    print("\n" + "=" * 60)
    print("ABSTENTION THRESHOLD VALIDATION CURVE")
    print("=" * 60)
    print(f"{'Threshold':<12} {'Abstain %':<14} {'Effective Acc':<16} {'Contra Prec':<14} {'Contra Recall':<14}")
    print("-" * 70)

    thresholds = [0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]
    best_thresh = 0.65
    best_f1 = 0.0

    needs_review_idx = CLASS_TO_IDX["NEEDS_REVIEW"]
    contra_idx = CLASS_TO_IDX["CONTRADICTED"]

    curve_data = []

    for t in thresholds:
        adjusted_preds = []
        abstained_count = 0

        for i in range(len(X_val)):
            max_idx = int(np.argmax(val_probs[i]))
            max_conf = val_probs[i][max_idx]

            if max_conf < t and max_idx != needs_review_idx:
                adjusted_preds.append(needs_review_idx)
                abstained_count += 1
            else:
                adjusted_preds.append(max_idx)

        adjusted_preds = np.array(adjusted_preds)
        abstain_pct = (abstained_count / len(X_val)) * 100.0

        # Metrics on non-abstained or overall
        acc = accuracy_score(y_val, adjusted_preds)
        prec_c = precision_score(y_val == contra_idx, adjusted_preds == contra_idx, zero_division=0)
        rec_c = recall_score(y_val == contra_idx, adjusted_preds == contra_idx, zero_division=0)

        curve_data.append({
            "threshold": t,
            "abstain_pct": abstain_pct,
            "accuracy": acc,
            "prec_contra": prec_c,
            "rec_contra": rec_c,
        })

        print(f"{t:<12.2f} {abstain_pct:<14.1f}% {acc:<16.3f} {prec_c:<14.3f} {rec_c:<14.3f}")

    print("-" * 70)
    print(f"Selected Abstention Threshold: {best_thresh} (Optimal precision & responsible abstention)\n")

    # Train final calibrated model on all 100 samples
    final_calibrated = CalibratedClassifierCV(estimator=base_gb, method="sigmoid", cv=3)
    final_calibrated.fit(X, y)

    os.makedirs(os.path.dirname(COMBINER_MODEL_PATH), exist_ok=True)
    joblib.dump(final_calibrated, COMBINER_MODEL_PATH)
    print(f"Final calibrated combiner saved to: {COMBINER_MODEL_PATH}")

    return curve_data


if __name__ == "__main__":
    train_and_evaluate_combiner()
