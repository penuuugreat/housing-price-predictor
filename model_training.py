
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os
import json

np.random.seed(42)


COUNTY_PROFILES = {
    0: ("Kisumu",    8_000,  0.28, 3_000),
    1: ("Mombasa",  14_000,  0.30, 5_000),
    2: ("Nairobi",  22_000,  0.35, 9_000),
    3: ("Nakuru",   10_000,  0.26, 3_500),
    4: ("Kiambu",   16_000,  0.32, 6_000),
    5: ("Eldoret",   9_000,  0.25, 3_200),
    6: ("Thika",    11_000,  0.27, 4_000),
    7: ("Machakos", 10_500,  0.26, 3_800),
}

PROPERTY_TYPE_PROFILES = {
    0: (0.60, "Bedsitter"),
    1: (1.00, "1 Bedroom"),
    2: (1.50, "2 Bedroom"),
    3: (2.00, "3 Bedroom"),
    4: (2.80, "Standalone House"),
}

FEATURES = ["county", "monthly_income_ksh", "property_type"]
TARGET   = "monthly_rent_ksh"



def load_real_data(csv_path: str) -> pd.DataFrame:
    """
    Load scraped data from scraper.py output.
    Expected columns: county (int), monthly_rent_ksh (float), property_type (int)
    
    Note: scraped data has no income column — we impute it from a realistic
    rent-to-income ratio (rent ÷ 0.30) with added noise, so the model still
    learns the income feature. Replace with real income data if you have it.
    """
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df):,} rows from {csv_path}")

    required = {"county", "monthly_rent_ksh", "property_type"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    df = df.dropna(subset=list(required))
    df = df[df["monthly_rent_ksh"].between(3_000, 2_000_000)]
    df["county"] = df["county"].astype(int)
    df["property_type"] = df["property_type"].astype(int)

    # Impute monthly_income_ksh from rent (assumes 30% rent-to-income + noise)
    df["monthly_income_ksh"] = (df["monthly_rent_ksh"] / 0.30) * np.random.uniform(0.8, 1.3, size=len(df))
    df["monthly_income_ksh"] = df["monthly_income_ksh"].clip(10_000, 500_000)

    print(f"After cleaning: {len(df):,} rows")
    return df[FEATURES + [TARGET]]


def generate_synthetic_data(n: int = 6_000) -> pd.DataFrame:
    """Generate realistic synthetic Kenya rental data as a fallback."""
    print(f"Generating {n:,} synthetic training samples...")
    rows = []
    for _ in range(n):
        county_id  = np.random.choice(list(COUNTY_PROFILES.keys()))
        prop_type  = np.random.choice(list(PROPERTY_TYPE_PROFILES.keys()))
        _, base_rent, inc_ratio, noise_std = COUNTY_PROFILES[county_id]
        pt_mult, _ = PROPERTY_TYPE_PROFILES[prop_type]

        income = float(np.clip(np.random.lognormal(mean=10.8, sigma=0.7), 10_000, 500_000))
        rent   = (base_rent + income * inc_ratio) * pt_mult
        rent  += np.random.normal(0, noise_std * pt_mult)
        rent   = max(3_000, rent)

        rows.append({
            "county":             county_id,
            "monthly_income_ksh": round(income, -2),
            "property_type":      prop_type,
            TARGET:               round(rent, -2),
        })
    return pd.DataFrame(rows)


# ── Train ─────────────────────────────────────────────────────────────────────

def train(df: pd.DataFrame, data_source: str) -> dict:
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    r2    = r2_score(y_test, preds)
    fi    = dict(zip(FEATURES, [round(v * 100, 1) for v in model.feature_importances_]))

    print(f"\nModel performance ({data_source}):")
    print(f"  Samples : {len(df):,}")
    print(f"  MAE     : KSh {mae:,.0f}")
    print(f"  R²      : {r2:.4f}")
    print(f"  Feature importances (%): {fi}")

    # Save
    out_dir = os.path.join(os.path.dirname(__file__), "backend", "model")
    os.makedirs(out_dir, exist_ok=True)

    model_path = os.path.join(out_dir, "kenya_rent_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    meta = {
        "counties":               {str(k): v[0] for k, v in COUNTY_PROFILES.items()},
        "property_types":         {str(k): v[1] for k, v in PROPERTY_TYPE_PROFILES.items()},
        "features":               FEATURES,
        "feature_importances_pct": fi,
        "n_samples":              len(df),
        "mae_ksh":                round(mae),
        "r2":                     round(r2, 4),
        "data_source":            data_source,
    }
    meta_path = os.path.join(out_dir, "model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nSaved → {model_path}")
    print(f"Saved → {meta_path}")
    return meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Kenya rent prediction model")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to scraped CSV (from scraper.py). Omit to use synthetic data.")
    parser.add_argument("--samples", type=int, default=6_000,
                        help="Number of synthetic samples (ignored if --data is provided)")
    args = parser.parse_args()

    if args.data:
        if not os.path.exists(args.data):
            raise FileNotFoundError(f"CSV not found: {args.data}")
        df = load_real_data(args.data)
        source = f"real ({args.data})"
    else:
        df = generate_synthetic_data(args.samples)
        source = "synthetic"

    train(df, source)
    print("\nDone. Redeploy backend to apply the new model.")
