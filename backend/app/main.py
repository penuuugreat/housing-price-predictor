# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pickle
import os

# ─── Input schemas ────────────────────────────────────────────────────────────

class InputData(BaseModel):
    county: int                          # Kisumu=0, Mombasa=1, Nairobi=2, Nakuru=3
    monthly_income_ksh: float
    property_type: Optional[int] = 1    # bedsitter=0, 1bed=1, 2bed=2, 3bed=3, standalone=4
    bedrooms: Optional[int] = 1         # 0=studio/bedsitter, 1, 2, 3, 4+

class CompareRequest(BaseModel):
    monthly_income_ksh: float
    property_type: Optional[int] = 1
    bedrooms: Optional[int] = 1

# ─── App setup ────────────────────────────────────────────────────────────────

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

# Load model
base = os.path.dirname(__file__)
with open(os.path.join(base, "..", "model", "kenya_rent_model.pkl"), "rb") as f:
    model = pickle.load(f)

# ─── Helpers ──────────────────────────────────────────────────────────────────

# Property type multipliers relative to a 1-bed apartment baseline.
# These are applied on top of the model's base prediction so the existing
# model doesn't need retraining for this MVP.
PROPERTY_MULTIPLIERS = {
    0: 0.65,   # bedsitter
    1: 1.00,   # 1-bedroom (baseline)
    2: 1.45,   # 2-bedroom
    3: 1.90,   # 3-bedroom
    4: 2.60,   # standalone house
}

BEDROOM_MULTIPLIERS = {
    0: 0.65,   # studio / bedsitter
    1: 1.00,
    2: 1.40,
    3: 1.85,
    4: 2.30,   # 4+
}

COUNTIES = {0: "Kisumu", 1: "Mombasa", 2: "Nairobi", 3: "Nakuru"}


def predict_rent(county: int, income: float, property_type: int, bedrooms: int) -> float:
    base_features = [[county, income]]
    base_pred = float(model.predict(base_features)[0])

    pt_mult = PROPERTY_MULTIPLIERS.get(property_type, 1.0)
    bed_mult = BEDROOM_MULTIPLIERS.get(bedrooms, 1.0)

    # Average the two multipliers so they don't double-compound
    combined = (pt_mult + bed_mult) / 2
    adjusted = base_pred * combined

    return round(adjusted, -2)   # nearest 100


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "API is running", "service": "Kenya House Rent Prediction API"}


@app.post("/predict")
def predict(data: InputData):
    rent = predict_rent(
        data.county,
        data.monthly_income_ksh,
        data.property_type if data.property_type is not None else 1,
        data.bedrooms if data.bedrooms is not None else 1,
    )
    affordability_pct = round((rent / data.monthly_income_ksh) * 100, 1)

    return {
        "predicted_monthly_rent_ksh": rent,
        "affordability_pct": affordability_pct,
        "county": COUNTIES.get(data.county, "Unknown"),
    }


@app.post("/compare")
def compare(data: CompareRequest):
    """Return predicted rent for all 4 counties for the same inputs."""
    results = []
    for county_id, county_name in COUNTIES.items():
        rent = predict_rent(
            county_id,
            data.monthly_income_ksh,
            data.property_type if data.property_type is not None else 1,
            data.bedrooms if data.bedrooms is not None else 1,
        )
        affordability_pct = round((rent / data.monthly_income_ksh) * 100, 1)
        results.append({
            "county_id": county_id,
            "county": county_name,
            "predicted_monthly_rent_ksh": rent,
            "affordability_pct": affordability_pct,
        })
    return {"comparisons": results}
