from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # <-- IMPORT ADDED HERE
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')

app = FastAPI(title="Taxi Fare Prediction API")

# ==========================================
# 🛑 CORS FIX: Allows React to talk to FastAPI
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (like localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)
# ==========================================

# Setup Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "lgbm_taxi_fare_model.pkl"
FEATURES_PATH = BASE_DIR / "models" / "feature_columns.pkl"

model = None
feature_cols = None

# Load model when API starts
@app.on_event("startup")
def load_model():
    global model, feature_cols
    try:
        model = joblib.load(MODEL_PATH)
        feature_cols = joblib.load(FEATURES_PATH)
        print("✅ API: Model loaded successfully!")
    except Exception as e:
        print(f"❌ API Error loading model: {e}")

# Define the expected input from the user
class FareRequest(BaseModel):
    PULocationID: int
    DOLocationID: int
    passenger_count: int = 1
    trip_distance: float
    pickup_hour: int
    pickup_dayofweek: int
    RatecodeID: int = 1
    payment_type: int = 1
    trip_duration_min: float
    pickup_month: int = 1
    is_weekend: int = 0

@app.get("/")
def home():
    return {"message": "Taxi Fare API is running! Go to /docs to test it."}

@app.post("/predict")
def predict_fare(request: FareRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    
    # Get user input
    input_data = request.dict()
    
    # Calculate average speed dynamically
    if input_data['trip_duration_min'] > 0:
        input_data['avg_speed_mph'] = input_data['trip_distance'] / (input_data['trip_duration_min'] / 60)
    else:
        input_data['avg_speed_mph'] = 0
    
    # Create DataFrame with all 0s for features first
    df_dict = {col: 0 for col in feature_cols}
    
    # Update with the user's input
    for key, value in input_data.items():
        if key in df_dict:
            df_dict[key] = value
            
    # Convert to DataFrame in exact order
    df = pd.DataFrame([df_dict])[feature_cols]
    
    # Predict
    try:
        prediction = model.predict(df)[0]
        margin = 2.50 # Placeholder error margin
        
        return {
            "predicted_fare": round(prediction, 2),
            "interval_low": round(max(0, prediction - margin), 2),
            "interval_high": round(prediction + margin, 2),
            "currency": "USD"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))