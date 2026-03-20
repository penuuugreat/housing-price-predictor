# 🏠 House Price Predictor

A full-stack machine learning web application that predicts California housing prices in real time using a Linear Regression model.

![Tech Stack](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

---

## 🔗 Live Demo
👉 **https://penuuugreat-house-price-predictor.vercel.app/**

---

## 📸 Preview

> A sleek dark-themed React interface where users adjust sliders for income, rooms, and occupancy to get an instant house price prediction powered by a containerized ML API

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | FastAPI, Python |
| ML Model | Linear Regression (scikit-learn) |
| Dataset | California Housing Dataset |
| Containerization | Docker |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 📁 Project Structure

```
house-price-predictor/
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI app with /predict endpoint
│   ├── model/
│   │   └── linear_regression_model.pkl
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── HousePricePredictor.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ How It Works

1. User adjusts 3 input sliders on the React frontend:
   - **Median Income** — household income in the block group
   - **Average Rooms** — average number of rooms per household
   - **Average Occupancy** — average number of occupants per household
2. The frontend sends a `POST` request to the FastAPI backend
3. The backend feeds the inputs into the trained Linear Regression model
4. The predicted house price is returned and displayed instantly

---

## 🚀 Run Locally

### Prerequisites
- Docker Desktop installed
- Node.js installed

### Backend
```bash
cd backend
docker build -t house-price-api .
docker run -p 8000:8000 house-price-api
```
API will be live at: `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App will be live at: `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/predict` | Predict house price |
| GET | `/predict?MedInc=&AveRooms=&AveOccup=` | Predict via query params |

### Example Request
```json
POST /predict
{
  "MedInc": 5.0,
  "AveRooms": 6.0,
  "AveOccup": 3.0
}
```

### Example Response
```json
{
  "predicted_house_price": 2.345
}
```

---

## 👤 Author

**penuuugreat**
- GitHub: [@penuuugreat](https://github.com/penuuugreat)
