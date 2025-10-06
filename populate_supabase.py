#!/usr/bin/env python3
"""
Populate Supabase with sample stock picks data
"""

import requests
import json
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://nxgtznzhnzlfcofkfbay.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Z3R6bnpobnpsZmNvZmtmYmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDgyNzIsImV4cCI6MjA3NTE4NDI3Mn0.ALPgcvzcF-DHk-9vUdHu30Zopv8BLJuevnxNej8DBqM"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Sample stock picks data (matching actual schema)
sample_picks = [
    {
        "symbol": "AAPL",
        "company_name": "Apple Inc.",
        "rank": 1,
        "ai_score": 92.5,
        "confidence": 0.88,
        "risk_score": 22.3,
        "predicted_return": 18.5,
        "category": "growth",
        "xgboost_score": 0.35,
        "random_forest_score": 0.25,
        "lightgbm_score": 0.30,
        "lstm_score": 0.10,
        "factor_scores": {
            "revenue_growth": 0.28,
            "momentum": 0.22,
            "market_sentiment": 0.18
        }
    },
    {
        "symbol": "MSFT",
        "company_name": "Microsoft Corporation",
        "rank": 2,
        "ai_score": 89.3,
        "confidence": 0.85,
        "risk_score": 24.1,
        "predicted_return": 16.2,
        "category": "growth",
        "xgboost_score": 0.32,
        "random_forest_score": 0.28,
        "lightgbm_score": 0.28,
        "lstm_score": 0.12,
        "factor_scores": {
            "revenue_growth": 0.25,
            "ai_momentum": 0.30,
            "market_sentiment": 0.20
        }
    },
    {
        "symbol": "GOOGL",
        "company_name": "Alphabet Inc.",
        "rank": 3,
        "ai_score": 87.8,
        "confidence": 0.82,
        "risk_score": 26.5,
        "predicted_return": 15.8,
        "category": "growth",
        "xgboost_score": 0.30,
        "random_forest_score": 0.27,
        "lightgbm_score": 0.28,
        "lstm_score": 0.15,
        "factor_scores": {
            "ad_revenue": 0.26,
            "cloud_growth": 0.24,
            "momentum": 0.19
        }
    },
    {
        "symbol": "NVDA",
        "company_name": "NVIDIA Corporation",
        "rank": 4,
        "ai_score": 95.2,
        "confidence": 0.91,
        "risk_score": 35.8,
        "predicted_return": 25.3,
        "category": "high_growth",
        "xgboost_score": 0.38,
        "random_forest_score": 0.22,
        "lightgbm_score": 0.32,
        "lstm_score": 0.08,
        "factor_scores": {
            "ai_demand": 0.35,
            "gpu_sales": 0.30,
            "momentum": 0.25
        }
    },
    {
        "symbol": "TSLA",
        "company_name": "Tesla Inc.",
        "rank": 5,
        "ai_score": 84.6,
        "confidence": 0.78,
        "risk_score": 42.3,
        "predicted_return": 22.1,
        "category": "high_growth",
        "xgboost_score": 0.28,
        "random_forest_score": 0.30,
        "lightgbm_score": 0.26,
        "lstm_score": 0.16,
        "factor_scores": {
            "ev_sales": 0.28,
            "innovation": 0.24,
            "volatility": 0.22
        }
    },
    {
        "symbol": "AMZN",
        "company_name": "Amazon.com Inc.",
        "rank": 6,
        "ai_score": 86.4,
        "confidence": 0.80,
        "risk_score": 28.7,
        "predicted_return": 17.3,
        "category": "growth",
        "xgboost_score": 0.31,
        "random_forest_score": 0.26,
        "lightgbm_score": 0.29,
        "lstm_score": 0.14,
        "factor_scores": {
            "aws_growth": 0.32,
            "ecommerce": 0.22,
            "market_share": 0.20
        }
    },
    {
        "symbol": "META",
        "company_name": "Meta Platforms Inc.",
        "rank": 7,
        "ai_score": 82.9,
        "confidence": 0.76,
        "risk_score": 31.2,
        "predicted_return": 19.4,
        "category": "growth",
        "xgboost_score": 0.29,
        "random_forest_score": 0.28,
        "lightgbm_score": 0.27,
        "lstm_score": 0.16,
        "factor_scores": {
            "ad_revenue": 0.27,
            "metaverse": 0.18,
            "user_growth": 0.23
        }
    },
    {
        "symbol": "JPM",
        "company_name": "JPMorgan Chase & Co.",
        "rank": 8,
        "ai_score": 79.5,
        "confidence": 0.82,
        "risk_score": 18.9,
        "predicted_return": 12.6,
        "category": "value",
        "xgboost_score": 0.33,
        "random_forest_score": 0.30,
        "lightgbm_score": 0.25,
        "lstm_score": 0.12,
        "factor_scores": {
            "interest_rates": 0.30,
            "dividend": 0.25,
            "stability": 0.22
        }
    },
    {
        "symbol": "V",
        "company_name": "Visa Inc.",
        "rank": 9,
        "ai_score": 81.3,
        "confidence": 0.84,
        "risk_score": 20.5,
        "predicted_return": 14.2,
        "category": "growth",
        "xgboost_score": 0.32,
        "random_forest_score": 0.29,
        "lightgbm_score": 0.26,
        "lstm_score": 0.13,
        "factor_scores": {
            "transaction_volume": 0.28,
            "global_expansion": 0.24,
            "margins": 0.22
        }
    },
    {
        "symbol": "WMT",
        "company_name": "Walmart Inc.",
        "rank": 10,
        "ai_score": 77.8,
        "confidence": 0.79,
        "risk_score": 16.3,
        "predicted_return": 11.4,
        "category": "value",
        "xgboost_score": 0.30,
        "random_forest_score": 0.31,
        "lightgbm_score": 0.24,
        "lstm_score": 0.15,
        "factor_scores": {
            "ecommerce_growth": 0.26,
            "dividend": 0.24,
            "stability": 0.25
        }
    }
]

def create_tables():
    """Check if tables exist, print schema if needed"""
    print("📊 Checking Supabase tables...")
    
    # Try to query stock_picks table
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/stock_picks?limit=1",
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ stock_picks table exists")
        return True
    elif response.status_code == 404:
        print("❌ stock_picks table doesn't exist")
        print("\n📝 You need to create the table in Supabase SQL Editor:")
        print("""
CREATE TABLE stock_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    company_name TEXT,
    rank INTEGER,
    ai_score NUMERIC,
    confidence NUMERIC,
    risk_score NUMERIC,
    predicted_return NUMERIC,
    category TEXT,
    model_breakdown JSONB,
    top_factors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on symbol
CREATE INDEX idx_stock_picks_symbol ON stock_picks(symbol);
CREATE INDEX idx_stock_picks_rank ON stock_picks(rank);
""")
        return False
    else:
        print(f"⚠️  Error checking table: {response.status_code}")
        print(response.text)
        return False

def insert_sample_data():
    """Insert sample stock picks"""
    print("\n📥 Inserting sample stock picks...")
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/stock_picks",
        headers=headers,
        json=sample_picks
    )
    
    if response.status_code in [200, 201]:
        print(f"✅ Successfully inserted {len(sample_picks)} stock picks!")
        return True
    else:
        print(f"❌ Error inserting data: {response.status_code}")
        print(response.text)
        return False

def verify_data():
    """Verify data was inserted"""
    print("\n🔍 Verifying inserted data...")
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/stock_picks?select=symbol,company_name,ai_score&order=rank.asc&limit=5",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data)} records:")
        for pick in data:
            print(f"   • {pick['symbol']}: {pick['company_name']} (Score: {pick['ai_score']})")
        return True
    else:
        print(f"❌ Error verifying data: {response.status_code}")
        return False

if __name__ == "__main__":
    print("🚀 Supabase Data Population Script")
    print("=" * 50)
    
    if create_tables():
        if insert_sample_data():
            verify_data()
            print("\n✅ Done! Your Flutter app should now display data.")
    else:
        print("\n⚠️  Please create the table first in Supabase dashboard.")
        print("Visit: https://nxgtznzhnzlfcofkfbay.supabase.co")
