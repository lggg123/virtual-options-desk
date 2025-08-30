#!/usr/bin/env python3
"""
CrewAI Service for Virtual Options Desk
Advanced market analysis using AI agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)