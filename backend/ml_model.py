"""
Serves the trained relocation-urgency model (see train_model.py / this
project's README_MODEL.md for the full methodology and data sources).
"""
import csv
import json
import os

import joblib

_HERE = os.path.dirname(__file__)
_MODEL = joblib.load(os.path.join(_HERE, "urgency_model.joblib"))

with open(os.path.join(_HERE, "model_metadata.json")) as f:
    METADATA = json.load(f)

with open(os.path.join(_HERE, "district_urgency_scores.csv")) as f:
    DISTRICT_SCORES = list(csv.DictReader(f))

FEATURES = METADATA["features"]


def top_districts(limit: int = 20, state: str | None = None):
    rows = DISTRICT_SCORES
    if state:
        rows = [r for r in rows if r["state"].lower() == state.lower()]
    rows = sorted(rows, key=lambda r: -float(r["predicted_urgency"]))
    return [
        {
            "state": r["state"],
            "district": r["district"],
            "population": int(float(r["population"])),
            "urgencyScore": round(float(r["predicted_urgency"]), 4),
            "literacyRate": round(float(r["literacy_rate"]), 4),
            "landslideExposure": round(float(r["landslide_exposure"]), 4),
            "floodExposure": round(float(r["flood_exposure"]), 4),
            "cycloneExposure": round(float(r["cyclone_exposure"]), 4),
            "seismicExposure": round(float(r["seismic_exposure"]), 4),
        }
        for r in rows[:limit]
    ]


def predict_custom(features: dict) -> float:
    """Score an arbitrary feature vector live through the trained model —
    useful for a 'try the model' demo panel."""
    row = [[features.get(f, 0.0) for f in FEATURES]]
    return round(float(_MODEL.predict(row)[0]), 4)
