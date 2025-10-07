#!/usr/bin/env python3
"""
CrewAI Analysis Service for Virtual Options Desk
Provides market analysis using CrewAI agents
"""

import json
import sys
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

try:
    from crewai import Agent, Task, Crew
    from langchain_openai import ChatOpenAI
    CREWAI_AVAILABLE = True
except ImportError as e:
    CREWAI_AVAILABLE = False
    print(f"Warning: CrewAI not installed. Using mock analysis. Error: {e}", file=sys.stderr)


class MarketAnalysisAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.llm = None
        if CREWAI_AVAILABLE and api_key:
            try:
                self.llm = ChatOpenAI(
                    api_key=api_key,
                    model="gpt-4-turbo-preview",
                    temperature=0.1
                )
            except Exception as e:
                print(f"Warning: Could not initialize LLM: {e}", file=sys.stderr)
        
        self.crew = self._setup_crew()
    
    def _setup_crew(self):
        """Set up CrewAI agents and crew"""
        if not CREWAI_AVAILABLE or not self.llm:
            return None
        
        try:
            # Market Analyst Agent
            market_analyst = Agent(
                role='Senior Market Analyst',
                goal='Analyze market trends and provide trading insights',
                backstory="""You are a seasoned market analyst with 15+ years of experience
                in options trading and technical analysis. You specialize in identifying
                market trends, volatility patterns, and optimal entry/exit points.""",
                verbose=True,
                allow_delegation=False,
                llm=self.llm
            )
            
            # Risk Management Agent
            risk_manager = Agent(
                role='Risk Management Specialist',
                goal='Assess and minimize trading risks',
                backstory="""You are an expert in risk management with deep knowledge
                of options Greeks, portfolio theory, and risk-adjusted returns.
                Your focus is on protecting capital while maximizing returns.""",
                verbose=True,
                allow_delegation=False,
                llm=self.llm
            )
            
            # Strategy Agent
            strategy_expert = Agent(
                role='Options Strategy Expert',
                goal='Design optimal options strategies based on market conditions',
                backstory="""You are a specialist in options strategies with expertise
                in complex multi-leg trades, volatility trading, and market-neutral
                strategies. You excel at matching strategies to market conditions.""",
                verbose=True,
                allow_delegation=False,
                llm=self.llm
            )
            
            return Crew(
                agents=[market_analyst, risk_manager, strategy_expert],
                verbose=2
            )
        except Exception as e:
            print(f"Warning: Could not setup CrewAI crew: {e}", file=sys.stderr)
            return None
    
    def analyze_market_trend(self, market_data: List[Dict]) -> Dict[str, Any]:
        """Analyze market trend using CrewAI or fallback to statistical analysis"""
        
        if not market_data:
            return self._generate_error_response("No market data provided")
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(market_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        if self.crew and CREWAI_AVAILABLE:
            return self._crewai_analysis(df)
        else:
            return self._statistical_analysis(df)
    
    def _crewai_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Use CrewAI for analysis"""
        try:
            # Prepare market data summary
            market_summary = self._prepare_market_summary(df)
            
            # Create analysis task
            analysis_task = Task(
                description=f"""Analyze the following market data and provide:
                1. Market trend (bullish/bearish/sideways)
                2. Confidence level (0-1)
                3. Key support/resistance levels
                4. Volatility assessment
                5. Trading recommendations
                
                Market Data Summary:
                {market_summary}
                """,
                agent=self.crew.agents[0]  # Market analyst
            )
            
            # Execute analysis
            result = self.crew.kickoff([analysis_task])
            
            # Parse CrewAI result and structure response
            return self._parse_crewai_result(result, df)
            
        except Exception as e:
            print(f"CrewAI analysis failed: {e}", file=sys.stderr)
            return self._statistical_analysis(df)
    
    def _statistical_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Fallback statistical analysis"""
        try:
            prices = df['price'].values
            volumes = df.get('volume', pd.Series([1000] * len(df))).values
            timestamps = df['timestamp'].values
            
            # Calculate metrics
            returns = np.diff(np.log(prices))
            momentum = (prices[-1] - prices[0]) / prices[0]
            volatility = np.std(returns) * np.sqrt(252)  # Annualized
            
            # Trend determination
            sma_short = np.mean(prices[-5:]) if len(prices) >= 5 else prices[-1]
            sma_long = np.mean(prices[-20:]) if len(prices) >= 20 else np.mean(prices)
            
            if sma_short > sma_long * 1.02:
                trend = "bullish"
                confidence = min(0.8, abs(momentum) * 10)
            elif sma_short < sma_long * 0.98:
                trend = "bearish" 
                confidence = min(0.8, abs(momentum) * 10)
            else:
                trend = "sideways"
                confidence = 0.6
            
            # Generate 3D spline data
            spline_data = self._generate_3d_spline(prices, volumes, timestamps)
            
            reasoning = self._generate_reasoning(trend, momentum, volatility, confidence)
            
            return {
                "trend": trend,
                "confidence": float(confidence),
                "spline_data": spline_data,
                "reasoning": reasoning,
                "timeHorizon": "1D",
                "metrics": {
                    "momentum": float(momentum),
                    "volatility": float(volatility),
                    "current_price": float(prices[-1]),
                    "price_change": float(prices[-1] - prices[0]),
                    "price_change_pct": float(momentum * 100)
                },
                "support_resistance": {
                    "support": float(np.min(prices)),
                    "resistance": float(np.max(prices)),
                    "pivot": float(np.mean(prices))
                }
            }
            
        except Exception as e:
            return self._generate_error_response(f"Statistical analysis failed: {e}")
    
    def _generate_3d_spline(self, prices: np.ndarray, volumes: np.ndarray, timestamps: np.ndarray) -> Dict[str, List]:
        """Generate 3D spline data for visualization"""
        try:
            # Create time indices
            time_indices = np.arange(len(prices))
            
            # Normalize volumes for z-axis
            normalized_volumes = (volumes - np.min(volumes)) / (np.max(volumes) - np.min(volumes)) if np.max(volumes) > np.min(volumes) else np.ones_like(volumes)
            
            return {
                "x": time_indices.tolist(),
                "y": prices.tolist(), 
                "z": normalized_volumes.tolist()
            }
        except Exception:
            return {"x": [], "y": [], "z": []}
    
    def _prepare_market_summary(self, df: pd.DataFrame) -> str:
        """Prepare market data summary for CrewAI"""
        prices = df['price']
        latest_price = prices.iloc[-1]
        price_change = prices.iloc[-1] - prices.iloc[0]
        price_change_pct = (price_change / prices.iloc[0]) * 100
        
        high = prices.max()
        low = prices.min()
        volatility = prices.pct_change().std() * 100
        
        return f"""
        Latest Price: ${latest_price:.2f}
        Price Change: ${price_change:.2f} ({price_change_pct:.2f}%)
        High: ${high:.2f}
        Low: ${low:.2f}
        Volatility: {volatility:.2f}%
        Data Points: {len(df)}
        Time Range: {df['timestamp'].iloc[0]} to {df['timestamp'].iloc[-1]}
        """
    
    def _parse_crewai_result(self, result: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse CrewAI analysis result"""
        # This would need to be implemented based on actual CrewAI output format
        # For now, fallback to statistical analysis
        return self._statistical_analysis(df)
    
    def _generate_reasoning(self, trend: str, momentum: float, volatility: float, confidence: float) -> str:
        """Generate reasoning text for the analysis"""
        reasoning = f"Market shows {trend} trend with {confidence*100:.1f}% confidence. "
        
        if abs(momentum) > 0.05:
            reasoning += f"Strong momentum of {momentum*100:.1f}% indicates sustained direction. "
        elif abs(momentum) > 0.02:
            reasoning += f"Moderate momentum of {momentum*100:.1f}% suggests ongoing movement. "
        else:
            reasoning += "Limited momentum indicates consolidation phase. "
        
        if volatility > 0.3:
            reasoning += "High volatility suggests increased uncertainty and wider price swings."
        elif volatility > 0.2:
            reasoning += "Moderate volatility indicates normal market conditions."
        else:
            reasoning += "Low volatility suggests stable, range-bound trading."
        
        return reasoning
    
    def _generate_error_response(self, error_msg: str) -> Dict[str, Any]:
        """Generate error response"""
        return {
            "error": True,
            "message": error_msg,
            "trend": "sideways",
            "confidence": 0.0,
            "spline_data": {"x": [], "y": [], "z": []},
            "reasoning": f"Analysis failed: {error_msg}",
            "timeHorizon": "unknown"
        }


def main():
    """Main function to handle command line arguments and execute analysis"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No market data provided"}))
        return
    
    try:
        # Parse input data
        input_data = json.loads(sys.argv[1])
        market_data = input_data.get('marketData', [])
        api_key = input_data.get('apiKey')
        
        # Initialize analysis agent
        agent = MarketAnalysisAgent(api_key=api_key)
        
        # Perform analysis
        result = agent.analyze_market_trend(market_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"error": f"Analysis failed: {str(e)}"}))


if __name__ == "__main__":
    main()