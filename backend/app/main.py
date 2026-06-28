# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pickle
import json
import os


base = os.path.dirname(__file__)
model_dir = os.path.join(base, "..", "model")

with open(os.path.join(model_dir, "kenya_rent_model.pkl"), "rb") as f:
    model = pickle.load(f)

with open(os.path.join(model_dir, "model_meta.json")) as f:
    META = json.load(f)

COUNTIES        = {int(k): v for k, v in META["counties"].items()}
PROPERTY_TYPES  = {int(k): v for k, v in META["property_types"].items()}
FEAT_IMPORTANCE = META["feature_importances_pct"]   # {"county": 6.8, ...}

# ─── Input schemas ────────────────────────────────────────────────────────────

class InputData(BaseModel):
    county: int                        # 0–7 (see COUNTIES)
    monthly_income_ksh: float
    property_type: Optional[int] = 1  # 0–4 (see PROPERTY_TYPES)

class CompareRequest(BaseModel):
    monthly_income_ksh: float
    property_type: Optional[int] = 1


app = FastAPI(title="Kenya House Rent Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://penuuugreat-house-price-predictor.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def predict_rent(county: int, income: float, property_type: int) -> float:
    """Run model inference. property_type is now a first-class feature."""
    features = [[county, income, property_type]]
    pred = float(model.predict(features)[0])
    return round(pred, -2)   # round to nearest KSh 100

def rent_tier(rent: float) -> str:
    if rent < 10_000: return "Low Cost"
    if rent < 30_000: return "Mid Range"
    if rent < 70_000: return "Premium"
    return "Luxury"

@app.get("/")
def health_check():
    return {
        "status": "API is running",
        "service": "Kenya House Rent Prediction API",
        "counties": len(COUNTIES),
        "model_r2": META["r2"],
        "model_mae_ksh": META["mae_ksh"],
    }


@app.get("/meta")
def get_meta():
    """Return county list, property types, and model metrics for the frontend."""
    return {
        "counties": COUNTIES,
        "property_types": PROPERTY_TYPES,
        "feature_importances_pct": FEAT_IMPORTANCE,
        "model_r2": META["r2"],
        "model_mae_ksh": META["mae_ksh"],
    }


@app.post("/predict")
def predict(data: InputData):
    pt = data.property_type if data.property_type is not None else 1
    rent = predict_rent(data.county, data.monthly_income_ksh, pt)
    affordability_pct = round((rent / data.monthly_income_ksh) * 100, 1)

    # Simple per-feature contribution breakdown (relative to county averages)
    # Shows user which input drove the prediction most
    total_importance = sum(FEAT_IMPORTANCE.values())
    contributions = {
        "County":          round(FEAT_IMPORTANCE["county"] / total_importance * 100, 1),
        "Income":          round(FEAT_IMPORTANCE["monthly_income_ksh"] / total_importance * 100, 1),
        "Property Type":   round(FEAT_IMPORTANCE["property_type"] / total_importance * 100, 1),
    }

    return {
        "predicted_monthly_rent_ksh": rent,
        "affordability_pct": affordability_pct,
        "rent_tier": rent_tier(rent),
        "county": COUNTIES.get(data.county, "Unknown"),
        "property_type": PROPERTY_TYPES.get(pt, "Unknown"),
        "model_mae_ksh": META["mae_ksh"],          # so UI can show ± range
        "feature_contributions_pct": contributions, # for the explain panel
    }


@app.post("/compare")
def compare(data: CompareRequest):
    """Return predicted rent for all counties with same inputs."""
    pt = data.property_type if data.property_type is not None else 1
    results = []
    for county_id, county_name in COUNTIES.items():
        rent = predict_rent(county_id, data.monthly_income_ksh, pt)
        results.append({
            "county_id":                  county_id,
            "county":                     county_name,
            "predicted_monthly_rent_ksh": rent,
            "affordability_pct":          round((rent / data.monthly_income_ksh) * 100, 1),
            "rent_tier":                  rent_tier(rent),
        })
    # Sort cheapest to most expensive
    results.sort(key=lambda r: r["predicted_monthly_rent_ksh"])
    return {"comparisons": results}
