from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator, Field
import joblib
import pandas as pd
from pathlib import Path
import warnings
import logging
from datetime import datetime

warnings.filterwarnings('ignore')

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("taxi-api")

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Taxi Fare Prediction API",
    description="LightGBM-powered fare estimation for NYC taxi trips.",
    version="2.4.0",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
# Allows the Vite dev server (localhost:5173) to call this API freely.
# In production, replace "*" with your actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model Paths ───────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).resolve().parent.parent
MODEL_PATH    = BASE_DIR / "models" / "lgbm_taxi_fare_model.pkl"
FEATURES_PATH = BASE_DIR / "models" / "feature_columns.pkl"

model        = None
feature_cols = None

# ─── Startup: load model once ──────────────────────────────────────────────────
@app.on_event("startup")
def load_model():
    global model, feature_cols
    try:
        model        = joblib.load(MODEL_PATH)
        feature_cols = joblib.load(FEATURES_PATH)
        log.info("✅ Model loaded successfully — ready to serve predictions.")
    except FileNotFoundError as e:
        log.error(f"❌ Model file not found: {e}")
    except Exception as e:
        log.error(f"❌ Failed to load model: {e}")


# ─── Request Schema ────────────────────────────────────────────────────────────
# Every field here maps 1-to-1 with what PredictPage.jsx sends in its form state.
# Defaults mirror the useState() defaults in PredictPage.jsx exactly.
class FareRequest(BaseModel):

    # ── Primary inputs (driven by sliders in the UI) ──────────────────────────
    trip_distance:     float = Field(...,  description="Trip distance in miles (slider: 0.1–50)")
    trip_duration_min: float = Field(...,  description="Trip duration in minutes (slider: 1–180)")
    passenger_count:   int   = Field(1,    description="Number of passengers (slider: 1–6)")

    # ── Time inputs (driven by hour grid + day grid in the UI) ────────────────
    pickup_hour:      int = Field(14, description="Hour of pickup 0–23 (set by hour-grid picker)")
    pickup_dayofweek: int = Field(2,  description="Day of week 0=Mon … 6=Sun (set by day picker)")
    is_weekend:       int = Field(0,  description="Auto-set by UI: 1 if pickup_dayofweek >= 5")

    # ── Location / rate inputs (hidden in UI, sent with defaults) ─────────────
    PULocationID:  int = Field(263, description="TLC pickup zone ID")
    DOLocationID:  int = Field(161, description="TLC dropoff zone ID")
    RatecodeID:    int = Field(1,   description="Taxi rate code")
    payment_type:  int = Field(1,   description="Payment method code")
    pickup_month:  int = Field(5,   description="Month of pickup 1–12")

    # ── Validators: mirror the slider min/max values from FIELDS config ───────
    @validator("trip_distance")
    def distance_positive(cls, v):
        if v < 0.1:
            raise ValueError("trip_distance must be >= 0.1 miles (matches UI slider min)")
        if v > 50:
            raise ValueError("trip_distance must be <= 50 miles (matches UI slider max)")
        return round(v, 4)

    @validator("trip_duration_min")
    def duration_positive(cls, v):
        if v < 1:
            raise ValueError("trip_duration_min must be >= 1 minute (matches UI slider min)")
        if v > 180:
            raise ValueError("trip_duration_min must be <= 180 minutes (matches UI slider max)")
        return round(v, 4)

    @validator("passenger_count")
    def passengers_valid(cls, v):
        if not (1 <= v <= 6):
            raise ValueError("passenger_count must be 1-6 (matches UI slider range)")
        return v

    @validator("pickup_hour")
    def hour_valid(cls, v):
        if not (0 <= v <= 23):
            raise ValueError("pickup_hour must be 0-23 (matches 24-hour grid in UI)")
        return v

    @validator("pickup_dayofweek")
    def day_valid(cls, v):
        if not (0 <= v <= 6):
            raise ValueError("pickup_dayofweek must be 0-6 (Mon-Sun, matches day-grid in UI)")
        return v

    @validator("is_weekend", always=True)
    def weekend_valid(cls, v, values):
        # Recompute server-side as a safety net in case UI sends a wrong value.
        # UI sets is_weekend = dayofweek >= 5, so we enforce the same rule here.
        dow = values.get("pickup_dayofweek", 0)
        return 1 if dow >= 5 else 0

    @validator("pickup_month")
    def month_valid(cls, v):
        if not (1 <= v <= 12):
            raise ValueError("pickup_month must be 1-12")
        return v


# ─── Dynamic confidence margin ─────────────────────────────────────────────────
# Grows with distance and duration so that longer, less predictable trips
# get a wider interval — displayed in the UI's confidence-interval bar.
MARGIN_BASE     = 2.00   # baseline +/-$2.00
MARGIN_PER_MILE = 0.15   # +$0.15 per mile
MARGIN_PER_MIN  = 0.05   # +$0.05 per minute

def compute_margin(distance: float, duration: float) -> float:
    return round(MARGIN_BASE + MARGIN_PER_MILE * distance + MARGIN_PER_MIN * duration, 2)


# ─── Health routes ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status":  "online",
        "version": "2.4.0",
        "message": "Taxi Fare API is running. POST /predict to get a fare estimate.",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    """
    Lightweight health-check endpoint.
    The frontend Nav badge dot can ping this on mount to show live server status.
    Returns 'ok' when model is loaded, 'degraded' if model failed to load.
    """
    return {
        "status":       "ok" if model is not None else "degraded",
        "model_loaded": model is not None,
        "timestamp":    datetime.utcnow().isoformat() + "Z",
    }


# ─── Prediction route ──────────────────────────────────────────────────────────
@app.post("/predict", tags=["Prediction"])
def predict_fare(request: FareRequest):
    """
    Accepts the full form state from PredictPage.jsx and returns a response
    object whose keys map exactly to what the frontend reads:

      result.predicted_fare  -> AnimatedNumber (large price display)
      result.interval_low    -> p-range-end left label
      result.interval_high   -> p-range-end right label
      result.margin          -> p-meta-row 'Margin'
      result.avg_speed_mph   -> p-meta-row 'Avg speed'
      result.currency        -> p-meta-row 'Currency'
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error":   "MODEL_NOT_LOADED",
                "message": "The prediction model is not available. Check server logs.",
            },
        )

    input_data = request.dict()

    # ── Derived feature: avg speed ────────────────────────────────────────────
    # Not sent by the UI — computed here and echoed back for the meta row.
    duration_h = input_data["trip_duration_min"] / 60
    input_data["avg_speed_mph"] = (
        round(input_data["trip_distance"] / duration_h, 4) if duration_h > 0 else 0.0
    )

    # ── Build feature vector in exact column order the model expects ───────────
    df_dict = {col: 0 for col in feature_cols}
    for key, value in input_data.items():
        if key in df_dict:
            df_dict[key] = value

    df = pd.DataFrame([df_dict])[feature_cols]

    # ── Run inference ──────────────────────────────────────────────────────────
    try:
        prediction = float(model.predict(df)[0])
        prediction = max(0.0, prediction)   # fares can never be negative

        margin = compute_margin(
            input_data["trip_distance"],
            input_data["trip_duration_min"],
        )

        log.info(
            f"Prediction: ${prediction:.2f} +/-${margin} | "
            f"dist={input_data['trip_distance']}mi | "
            f"dur={input_data['trip_duration_min']}min | "
            f"pax={input_data['passenger_count']} | "
            f"hour={input_data['pickup_hour']} | "
            f"day={input_data['pickup_dayofweek']} | "
            f"weekend={input_data['is_weekend']} | "
            f"speed={input_data['avg_speed_mph']}mph"
        )

        return {
            "predicted_fare": round(prediction, 2),
            "interval_low":   round(max(0.0, prediction - margin), 2),
            "interval_high":  round(prediction + margin, 2),
            "margin":         margin,
            "avg_speed_mph":  round(input_data["avg_speed_mph"], 1),
            "currency":       "USD",
        }

    except Exception as e:
        log.error(f"Prediction failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error":   "PREDICTION_FAILED",
                "message": str(e),
            },
        )