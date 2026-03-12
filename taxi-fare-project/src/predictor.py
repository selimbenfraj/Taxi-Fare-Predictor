import joblib
import pandas as pd
import mlflow
from pathlib import Path


class TaxiFarePredictor:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent / "models"
        
        # Initialize MLflow
        mlflow.set_tracking_uri("sqlite:///mlflow.db")
        mlflow.set_experiment("taxi_fare_predictions")
        
        # Load model
        self.model = joblib.load(self.base_path / "lgbm_taxi_fare_model.pkl")
        self.exact_feature_order = joblib.load(self.base_path / "feature_columns.pkl")
        
        print("\n✅ Kaggle model loaded")
        print("✅ MLflow tracking enabled")


    def predict(self, trip_input: dict) -> dict:

        df_input = pd.DataFrame([trip_input])
        df_input = df_input.reindex(columns=self.exact_feature_order, fill_value=0)
        predicted_fare = self.model.predict(df_input)[0]
        uncertainty_margin = max(1.15, predicted_fare * 0.18)

        # ✅ Log EVERY prediction permanently
        with mlflow.start_run(run_name="api_prediction", nested=True):
            mlflow.log_inputs(trip_input)
            mlflow.log_metrics({
                "predicted_fare": predicted_fare,
                "uncertainty": uncertainty_margin
            })

        return {
            "predicted_fare":     round(float(predicted_fare), 2),
            "confidence_lower":   round(float(predicted_fare - uncertainty_margin), 2),
            "confidence_upper":   round(float(predicted_fare + uncertainty_margin), 2),
            "confidence_level":   0.8,
            "currency":           "USD"
        }


predictor = TaxiFarePredictor()