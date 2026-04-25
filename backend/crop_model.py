#  Crop Recommendation Model Integration
#  Loads trained Random Forest model and
import joblib
import numpy as np
import pandas as pd
import os

# ── Load model files ───────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model     = joblib.load(os.path.join(BASE_DIR, "crop_recommendation_model.joblib"))
scaler    = joblib.load(os.path.join(BASE_DIR, "scaler.joblib"))
soil_enc  = joblib.load(os.path.join(BASE_DIR, "soil_encoder.joblib"))
crop_enc  = joblib.load(os.path.join(BASE_DIR, "crop_encoder.joblib"))

# ── Valid inputs ───────────────────────────
VALID_SOILS = [
    "Acidic Soil", "Alkaline Soil", 
    "Loamy Soil", "Neutral Soil", "Peaty Soil"
]

FEATURE_COLS = [
    "Temperature", "Moisture", "Rainfall", "PH",
    "Nitrogen", "Phosphorus", "Potassium", "Carbon", "Soil"
]

NUMERIC_COLS = [
    "Temperature", "Moisture", "Rainfall", "PH",
    "Nitrogen", "Phosphorus", "Potassium", "Carbon"
]

# ─────────────────────────────────────────────
#  Main prediction function
# ─────────────────────────────────────────────

def predict_crop(
    temp, moisture, rainfall, ph,
    nitrogen, phosphorus, potassium,
    carbon, soil_type
):
    """
    Predicts top 3 recommended crops with
    confidence scores and feature importance.

    Args:
        temp        : Temperature in °C
        moisture    : Soil moisture (0-1)
        rainfall    : Rainfall in mm
        ph          : Soil pH
        nitrogen    : Nitrogen kg/ha
        phosphorus  : Phosphorus kg/ha
        potassium   : Potassium kg/ha
        carbon      : Organic carbon
        soil_type   : One of VALID_SOILS

    Returns:
        dict with top_3_crops and feature_importance
    """

    # ── Validate soil type ─────────────────
    if soil_type not in VALID_SOILS:
        return {
            "error": f"Invalid soil type: '{soil_type}'",
            "valid_soils": VALID_SOILS
        }

    # ── Validate numeric ranges ────────────
    validations = [
        (temp,        0,    60,   "Temperature"),
        (moisture,    0,    1,    "Moisture"),
        (rainfall,    0,    500,  "Rainfall"),
        (ph,          0,    14,   "PH"),
        (nitrogen,    0,    200,  "Nitrogen"),
        (phosphorus,  0,    300,  "Phosphorus"),
        (potassium,   0,    300,  "Potassium"),
        (carbon,      -2,   5,    "Carbon"),
    ]

    for val, min_val, max_val, name in validations:
        if not (min_val <= float(val) <= max_val):
            return {
                "error": f"{name} value {val} is out of range ({min_val}-{max_val})"
            }

    try:
        # ── Encode soil type ───────────────
        soil_encoded = soil_enc.transform([soil_type])[0]

        # ── Build input dataframe ──────────
        input_data = pd.DataFrame(
            [[temp, moisture, rainfall, ph,
              nitrogen, phosphorus, potassium,
              carbon, soil_encoded]],
            columns=FEATURE_COLS
        )

        # ── Scale numeric columns ──────────
        input_data[NUMERIC_COLS] = scaler.transform(
            input_data[NUMERIC_COLS]
        )

        # ── Get probabilities ──────────────
        probabilities = model.predict_proba(input_data)[0]

        # ── Get top 3 crops ────────────────
        top_3_indices = np.argsort(probabilities)[::-1][:3]

        top_3_crops = []
        for idx in top_3_indices:
            crop_name  = crop_enc.inverse_transform([idx])[0]
            confidence = round(float(probabilities[idx]) * 100, 2)
            top_3_crops.append({
                "crop":       crop_name,
                "confidence": confidence
            })

        # ── Feature importance ─────────────
        importances  = model.feature_importances_
        feat_imp = {
            feat: round(float(imp) * 100, 2)
            for feat, imp in zip(FEATURE_COLS, importances)
        }
        feat_imp = dict(
            sorted(feat_imp.items(),
                   key=lambda x: x[1],
                   reverse=True)
        )
        # Remove Soil from importance display
        feat_imp.pop("Soil", None)

        return {
            "top_3_crops":        top_3_crops,
            "feature_importance": feat_imp,
            "status":             "success"
        }

    except Exception as e:
        return {
            "error":  str(e),
            "status": "error"
        }


def get_feature_importance():
    """
    Returns feature importance without prediction.
    Used for the Feature Importance chart in dashboard.
    """
    importances = model.feature_importances_
    feat_imp = {
        feat: round(float(imp) * 100, 2)
        for feat, imp in zip(FEATURE_COLS, importances)
    }
    feat_imp.pop("Soil", None)
    return dict(
        sorted(feat_imp.items(),
               key=lambda x: x[1],
               reverse=True)
    )