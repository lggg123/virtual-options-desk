#!/usr/bin/env python3
"""
CrewAI Service for Virtual Options Desk
Advanced market analysis using AI agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import joblib
import pandas as pd
import json
import sys
import os
from datetime import datetime

# Add the python directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

try:
    from python.crewai_analysis import MarketAnalysisAgent
    CREWAI_AVAILABLE = True
except ImportError as e:
    print(f"Warning: CrewAI not available: {e}")
    CREWAI_AVAILABLE = False

app = FastAPI(
    title="CrewAI Market Analysis Service",
    description="Advanced AI-powered market analysis using CrewAI agents",
    version="1.0.0"
)

# --- New endpoint: Top 10 AI stock picks ---
@app.get("/top_breakout_picks")
async def top_breakout_picks(csv_path: str = "data/latest_stock_data.csv", n: int = 10):
    """Return the top N stocks with highest breakout probability using the trained model."""
    import traceback
    if breakout_clf.model is None:
        print("[ERROR] Model not loaded.")
        raise HTTPException(status_code=503, detail="Model not loaded.")
    if not os.path.exists(csv_path):
        print(f"[ERROR] CSV file not found: {csv_path}")
        raise HTTPException(status_code=404, detail=f"CSV file not found: {csv_path}")
    try:
        df = pd.read_csv(csv_path)
        print(f"[DEBUG] DataFrame columns: {df.columns.tolist()}")
        print(f"[DEBUG] DataFrame shape: {df.shape}")
        # Ensure required columns exist and are numeric
        for col in ['open', 'high', 'low', 'close', 'volume']:
            if col not in df.columns:
                print(f"[ERROR] Missing column: {col}")
                raise HTTPException(status_code=400, detail=f"Missing column: {col}")
            df[col] = pd.to_numeric(df[col], errors='coerce')
        df = df.dropna(subset=['open', 'high', 'low', 'close', 'volume'])
        print(f"[DEBUG] DataFrame after dropna shape: {df.shape}")
        X = df[['open', 'high', 'low', 'close', 'volume']]
        print(f"[DEBUG] Predict input shape: {X.shape}")
        probs = breakout_clf.predict(X)
        print(f"[DEBUG] Prediction output shape: {probs.shape}")
        df['breakout_probability'] = probs
        top = df.sort_values('breakout_probability', ascending=False).head(n)
        picks = top[['symbol', 'breakout_probability']].to_dict(orient='records') if 'symbol' in top.columns else top.head(n).to_dict(orient='records')
        print(f"[DEBUG] Top picks: {picks}")
        return {"top_picks": picks}
    except Exception as e:
        print(f"[ERROR] Exception in /top_breakout_picks: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate picks: {str(e)}")
#!/usr/bin/env python3
"""
CrewAI Service for Virtual Options Desk
Advanced market analysis using AI agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import joblib
import pandas as pd
import json
import sys
import os
from datetime import datetime

# Add the python directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

try:
    from python.crewai_analysis import MarketAnalysisAgent
    CREWAI_AVAILABLE = True
except ImportError as e:
    print(f"Warning: CrewAI not available: {e}")
    CREWAI_AVAILABLE = False

app = FastAPI(
    title="CrewAI Market Analysis Service",
    description="Advanced AI-powered market analysis using CrewAI agents",
    version="1.0.0"
)

# --- Breakout Classifier Model Loader ---
class BreakoutStockClassifier:
    def __init__(self):
        self.model = None
    def load(self, path):
        self.model = joblib.load(path)
    def predict(self, X):
        return self.model.predict_proba(X)[:, 1] if self.model else None

# Load the trained model at startup
MODEL_PATH = os.path.join("python", "ml_models", "breakout_classifier_xgb_stockslist.pkl")
breakout_clf = BreakoutStockClassifier()
if os.path.exists(MODEL_PATH):
    breakout_clf.load(MODEL_PATH)
else:
    print(f"Warning: Model file not found at {os.path.abspath(MODEL_PATH)}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class MarketDataPoint(BaseModel):
    price: float
    volume: Optional[float] = 1000
    timestamp: str
    symbol: Optional[str] = "SPY"

# For breakout prediction
class BreakoutDataPoint(BaseModel):
    open: float
    high: float
    low: float
    close: float
    volume: float
# Existing endpoints ...

# --- New endpoint: Breakout prediction using trained model ---
@app.post("/predict_breakout")
async def predict_breakout(data: BreakoutDataPoint):
    """Predict breakout probability for a single data point using the trained model."""
    if breakout_clf.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    # Prepare input as DataFrame
    X = pd.DataFrame([{k: getattr(data, k) for k in ['open', 'high', 'low', 'close', 'volume']}])
    prob = breakout_clf.predict(X)
    return {"breakout_probability": float(prob[0])}

class AnalysisRequest(BaseModel):
    marketData: List[MarketDataPoint]
    apiKey: Optional[str] = None
    timeHorizon: Optional[str] = "1D"

@app.get("/")
async def root():
    return {
        "message": "CrewAI Market Analysis Service",
        "version": "1.0.0",
        "crewai_available": CREWAI_AVAILABLE,
        "agents": [
            "Market Analyst",
            "Risk Manager", 
            "Strategy Expert"
        ] if CREWAI_AVAILABLE else []
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "crewai_available": CREWAI_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze")
async def analyze_market(request: AnalysisRequest):
    """Advanced market analysis using CrewAI agents"""
    
    if not CREWAI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="CrewAI service unavailable - agents not initialized"
        )
    
    try:
        # Convert request to format expected by analysis agent
        market_data = [
            {
                "price": point.price,
                "volume": point.volume or 1000,
                "timestamp": point.timestamp
            }
            for point in request.marketData
        ]
        
        # Initialize analysis agent
        agent = MarketAnalysisAgent(api_key=request.apiKey)
        
        # Perform analysis
        result = agent.analyze_market_trend(market_data)
        
        # Add metadata
        result["generated_at"] = datetime.now().isoformat()
        result["agent_source"] = "crewai"
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CrewAI analysis failed: {str(e)}"
        )

class BlogRequest(BaseModel):
    topic: Optional[str] = "daily market analysis"
    symbols: Optional[List[str]] = ["SPY", "AAPL", "TSLA"]
    apiKey: Optional[str] = None

@app.post("/generate-blog")
async def generate_blog(request: BlogRequest):
    """Generate automated daily blog post using CrewAI agents"""
    
    if not CREWAI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="CrewAI service unavailable - agents not initialized"
        )
    
    try:
        # Initialize analysis agent
        agent = MarketAnalysisAgent(api_key=request.apiKey)
        
        # Generate blog content
        blog_content = {
            "title": f"Daily Market Insights - {datetime.now().strftime('%B %d, %Y')}",
            "date": datetime.now().isoformat(),
            "topic": request.topic,
            "symbols_analyzed": request.symbols,
            "content": f"AI-generated market analysis for {', '.join(request.symbols)}",
            "summary": "Comprehensive market analysis using advanced AI agents",
            "tags": ["market analysis", "AI", "stocks", "trading"],
            "generated_by": "crewai",
            "generated_at": datetime.now().isoformat()
        }
        
        return blog_content
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Blog generation failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)