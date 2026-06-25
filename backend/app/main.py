# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import os

class InputData(BaseModel):
    county: int          # encoded: Kisumu=0, Mombasa=1, Nairobi=2, Nakuru=3
    monthly_income_ksh: float

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

# Load model and encoder
base = os.path.dirname(__file__)
with open(os.path.join(base, "..", "model", "kenya_rent_model.pkl"), "rb") as f:
    model = pickle.load(f)

@app.get("/")
def health_check():
    return {"status": "API is running", "service": "Kenya House Rent Prediction API"}

@app.post("/predict")
def predict(data: InputData):
    features = [[data.county, data.monthly_income_ksh]]
    prediction = model.predict(features)
    return {
        "predicted_monthly_rent_ksh": round(float(prediction[0]), -2)  # round to nearest 100
    }
