import joblib
import pandas as pd
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')

# 1. Setup paths based on file location
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "lgbm_taxi_fare_model.pkl"
FEATURES_PATH = BASE_DIR / "models" / "feature_columns.pkl"

def test_local_model():
    print("🔄 Loading model and features...")
    
    # 2. Load the model and features
    model = joblib.load(MODEL_PATH)
    feature_cols = joblib.load(FEATURES_PATH)
    print("✅ Model loaded successfully!")

    # 3. Create a fake trip to test prediction
    # We set all columns to 0 first, then update the important ones
    dummy_data = {col: 0 for col in feature_cols}
    dummy_data.update({
        'PULocationID': 263, 
        'DOLocationID': 161, 
        'passenger_count': 1,
        'trip_distance': 2.5, 
        'pickup_hour': 14, 
        'pickup_dayofweek': 2,
        'trip_duration_min': 12.0,
        'avg_speed_mph': 12.5
    })

    # 4. Convert to DataFrame and predict
    df = pd.DataFrame([dummy_data])[feature_cols]
    pred = model.predict(df)[0]
    
    print(f"\n🚕 Test Prediction for dummy trip: ${pred:.2f}\n")

if __name__ == "__main__":
    test_local_model()