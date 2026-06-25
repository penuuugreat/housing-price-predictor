# 🏠 Kenya Rental Oracle

A full-stack machine learning web application that predicts monthly residential rent across major Kenyan counties in real time, using a Random Forest model trained on Kenya housing data.

![Tech Stack](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

---

## 🔗 Live Demo
👉 **https://penuuugreat-house-price-predictor.vercel.app/**

---

## 📸 Preview

> A sleek dark-themed React interface styled as a "Rental Oracle" — users select a Kenyan county and adjust a monthly income slider to instantly receive a predicted monthly rent, with tier labeling (Low Cost, Mid Range, Premium, Luxury) powered by a containerized ML API.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Backend | FastAPI, Python |
| ML Model | Random Forest (scikit-learn) |
| Dataset | Kenya Housing / Rental Data |
| Containerization | Docker, Docker Compose |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Cloud Deployment | Azure Container Instances (optional) |

---

## 📁 Project Structure

```
housing-price-predictor/
├── backend/
│   ├── app/
│   │   └── main.py               # FastAPI app with /predict endpoint
│   ├── model/
│   │   └── kenya_rent_model.pkl  # Trained Random Forest model
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── HousePricePredictor.jsx  # Main UI component
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── model_training.py             # Model training script
├── docker-compose.yml
├── deploy-to-azure.ps1           # Azure ACI deployment script
├── AZURE_DEPLOYMENT_GUIDE.md
└── README.md
```

---

## ⚙️ How It Works

1. The user selects a **county** and adjusts the **monthly household income** slider on the React frontend.
2. The frontend sends a `POST` request to the FastAPI backend.
3. The backend feeds the inputs into the trained Random Forest model (`kenya_rent_model.pkl`).
4. The predicted monthly rent (in KSh, rounded to the nearest 100) is returned and displayed instantly, along with a housing tier classification.

### County Encoding

| County | Encoded Value |
|---|---|
| Kisumu | 0 |
| Mombasa | 1 |
| Nairobi | 2 |
| Nakuru | 3 |

### Rent Tier Classification (Frontend)

| Monthly Rent | Tier |
|---|---|
| Below KSh 10,000 | Low Cost Housing |
| KSh 10,000 – 29,999 | Mid Range |
| KSh 30,000 – 69,999 | Premium |
| KSh 70,000+ | Luxury |

---

## 🚀 Run Locally

### Prerequisites
- Docker Desktop installed and running
- Node.js (v18+) installed

### Option 1 — Docker Compose (Full Stack)
```bash
docker-compose up --build
```
- Backend API: `http://localhost:8000`
- Frontend app: `http://localhost:5173`

### Option 2 — Manual Setup

**Backend**
```bash
cd backend
docker build -t kenya-rent-api .
docker run -p 8000:8000 kenya-rent-api
```
API will be live at: `http://localhost:8000`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
App will be live at: `http://localhost:5173`

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/predict` | Predict monthly rent |

### Request Body
```json
POST /predict
{
  "county": 2,
  "monthly_income_ksh": 50000
}
```

| Field | Type | Description |
|---|---|---|
| `county` | `int` | Encoded county value (0=Kisumu, 1=Mombasa, 2=Nairobi, 3=Nakuru) |
| `monthly_income_ksh` | `float` | Monthly household income in Kenyan Shillings |

### Example Response
```json
{
  "predicted_monthly_rent_ksh": 25000
}
```
> Predictions are rounded to the nearest KSh 100.

---

## 🧠 Model Training

To retrain the model, run:
```bash
python model_training.py
```
This will output a new `kenya_rent_model.pkl` into `backend/model/`.

> **Note:** The current `model_training.py` references a Kenya housing dataset. Ensure your local dataset is available before retraining.

---

## ☁️ Azure Deployment

A fully automated PowerShell deployment script is included for deploying the backend to **Azure Container Instances (ACI)**.

```powershell
.\deploy-to-azure.ps1
```

See [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md) for full instructions, including:
- Prerequisites (Azure CLI, Docker Desktop)
- Customising resource group, registry, and region
- Cost estimates (fits within ACI free tier for typical use)
- Managing, monitoring, and tearing down the deployment

---

## 👤 Author

**penuuugreat**
- GitHub: [@penuuugreat](https://github.com/penuuugreat)
