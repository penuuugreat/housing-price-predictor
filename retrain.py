
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import json
import os
import sklearn

print(f"Retraining with scikit-learn {sklearn.__version__}")

np.random.seed(42)
N = 6000

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

rows = []
for _ in range(N):
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
        "monthly_rent_ksh":   round(rent, -2),
    })

df = pd.DataFrame(rows)
FEATURES = ["county", "monthly_income_ksh", "property_type"]
X = df[FEATURES]
y = df["monthly_rent_ksh"]

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

print(f"MAE: KSh {mae:,.0f}  |  R²: {r2:.4f}  |  sklearn: {sklearn.__version__}")

out_dir = "/code/model"
os.makedirs(out_dir, exist_ok=True)

with open(os.path.join(out_dir, "kenya_rent_model.pkl"), "wb") as f:
    pickle.dump(model, f)

meta = {
    "counties":                {str(k): v[0] for k, v in COUNTY_PROFILES.items()},
    "property_types":          {str(k): v[1] for k, v in PROPERTY_TYPE_PROFILES.items()},
    "features":                FEATURES,
    "feature_importances":     fi,           # used by main.py
    "feature_importances_pct": fi,           # alias for compatibility
    "n_samples":               N,
    "mae_ksh":                 round(mae),
    "r2":                      round(r2, 4),
    "sklearn_version":         sklearn.__version__,
}
with open(os.path.join(out_dir, "model_meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"Saved model + metadata to {out_dir}")
