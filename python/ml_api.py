"""
FastAPI service for ML model training and predictions
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import asyncio
import json
import sys
import os

# Add parent directory to path for local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Try production import first
    from ml_ensemble import (
        StockScreeningEnsemble,
        MonthlyScreeningPipeline,
        ModelPrediction
    )
except ImportError:
    # Fall back to development import
    from python.ml_ensemble import (
        StockScreeningEnsemble,
        MonthlyScreeningPipeline,
        ModelPrediction
    )

app = FastAPI(title="Stock Screening ML API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global ensemble instance
ensemble = StockScreeningEnsemble()
training_status = {
    "is_training": False,
    "progress": 0,
    "message": "Not started",
    "started_at": None,
    "completed_at": None
}


# ==================== REQUEST/RESPONSE MODELS ====================

class TrainingRequest(BaseModel):
    forward_days: int = 30
    cv_splits: int = 5
    force_retrain: bool = False


class PredictionRequest(BaseModel):
    symbols: List[str]
    top_n: Optional[int] = 100


class ScreeningRequest(BaseModel):
    universe: List[str]
    top_n: int = 1000


class TrainingStatusResponse(BaseModel):
    is_training: bool
    is_trained: bool
    progress: int
    message: str
    started_at: Optional[str]
    completed_at: Optional[str]


class PredictionResponse(BaseModel):
    predictions: List[Dict]
    generated_at: str
    model_version: str


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "Stock Screening ML API",
        "status": "online",
        "version": "1.0.0",
        "models_trained": ensemble.is_trained
    }


@app.get("/health")
async def health():
    """Health check endpoint for Render"""
    return {"status": "healthy"}


@app.get("/api/ml/status", response_model=TrainingStatusResponse)
async def get_training_status():
    """Get current training status"""
    return TrainingStatusResponse(
        is_training=training_status["is_training"],
        is_trained=ensemble.is_trained,
        progress=training_status["progress"],
        message=training_status["message"],
        started_at=training_status["started_at"],
        completed_at=training_status["completed_at"]
    )


@app.post("/api/ml/train")
async def train_models(request: TrainingRequest, background_tasks: BackgroundTasks):
    """
    Start model training process
    Note: This is a background task that may take a while
    """
    
    if training_status["is_training"]:
        raise HTTPException(status_code=400, detail="Training already in progress")
    
    if ensemble.is_trained and not request.force_retrain:
        return {
            "message": "Models already trained. Use force_retrain=true to retrain.",
            "trained_at": training_status["completed_at"]
        }
    
    # Start training in background
    background_tasks.add_task(
        train_models_task,
        forward_days=request.forward_days,
        cv_splits=request.cv_splits
    )
    
    return {
        "message": "Training started in background",
        "check_status": "/api/ml/status"
    }


async def train_models_task(forward_days: int, cv_splits: int):
    """Background task for model training"""
    
    global training_status
    
    try:
        training_status["is_training"] = True
        training_status["started_at"] = datetime.now().isoformat()
        training_status["message"] = "Preparing data..."
        training_status["progress"] = 10
        
        # TODO: Load actual stock factors and price data
        # This is where you'd integrate with your data pipeline
        stock_factors = []  # Load from database or API
        price_data = {}  # Load historical prices
        
        training_status["message"] = "Training models..."
        training_status["progress"] = 30
        
        # Train ensemble
        ensemble.train(stock_factors, price_data, forward_days, cv_splits)
        
        training_status["message"] = "Saving models..."
        training_status["progress"] = 90
        
        # Save trained models
        ensemble.save_models()
        
        training_status["is_training"] = False
        training_status["completed_at"] = datetime.now().isoformat()
        training_status["message"] = "Training completed successfully"
        training_status["progress"] = 100
        
    except Exception as e:
        training_status["is_training"] = False
        training_status["message"] = f"Training failed: {str(e)}"
        training_status["progress"] = 0


@app.post("/api/ml/predict", response_model=PredictionResponse)
async def generate_predictions(request: PredictionRequest):
    """
    Generate predictions for a list of symbols
    """
    
    if not ensemble.is_trained:
        # Try to load models
        try:
            ensemble.load_models()
        except FileNotFoundError:
            raise HTTPException(
                status_code=400,
                detail="Models not trained yet. Please train models first at /api/ml/train"
            )
    
    try:
        # TODO: Load stock factors for the requested symbols
        # This is where you'd integrate with your factor calculator
        stock_factors = []  # Load factors for request.symbols
        
        # Generate predictions
        predictions = ensemble.predict(stock_factors)
        
        # Filter top N if requested
        if request.top_n:
            predictions = predictions[:request.top_n]
        
        return PredictionResponse(
            predictions=[pred.to_dict() for pred in predictions],
            generated_at=datetime.now().isoformat(),
            model_version="1.0.0"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/ml/screen")
async def run_screening(request: ScreeningRequest):
    """
    Run monthly screening on a universe of stocks
    """
    
    if not ensemble.is_trained:
        try:
            ensemble.load_models()
        except FileNotFoundError:
            raise HTTPException(
                status_code=400,
                detail="Models not trained yet. Please train models first."
            )
    
    try:
        pipeline = MonthlyScreeningPipeline(ensemble)
        top_picks = await pipeline.run_monthly_screen(request.universe, request.top_n)
        
        return {
            "top_picks": [pick.to_dict() for pick in top_picks],
            "total_screened": len(request.universe),
            "top_n": request.top_n,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screening failed: {str(e)}")


@app.get("/api/ml/feature-importance")
async def get_feature_importance():
    """Get feature importance from trained models"""
    
    if not ensemble.is_trained:
        raise HTTPException(status_code=400, detail="Models not trained yet")
    
    return {
        "feature_importance": ensemble.feature_importance,
        "model_count": len(ensemble.models),
        "feature_count": len(ensemble.feature_engineer.feature_names)
    }


@app.delete("/api/ml/models")
async def delete_models():
    """Delete trained models (for cleanup/retraining)"""
    
    import shutil
    import os
    
    model_path = "ml_models"
    
    if os.path.exists(model_path):
        shutil.rmtree(model_path)
        ensemble.is_trained = False
        return {"message": "Models deleted successfully"}
    else:
        return {"message": "No models found"}


# ==================== STARTUP/SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    """Try to load models on startup"""
    try:
        ensemble.load_models()
        print("✅ Models loaded successfully on startup")
    except FileNotFoundError:
        print("⚠️  No pre-trained models found. Train models at /api/ml/train")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
