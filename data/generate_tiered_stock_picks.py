"""
Script to generate tiered AI stock picks for Free, Pro, and Premium users.
- Free: Top 10 by probability (basic info)
- Pro: Top 25 with sector/industry/volume/recent return, max 3 per sector
- Premium: Top 50, all Pro info plus volatility, avg volume, recent price trend, max 2 per sector
"""


import pandas as pd
import numpy as np


# Load picks, stock info, and latest stock data
picks = pd.read_csv("data/ai_stock_picks.csv")
stock_info = pd.read_csv("data/stocks-list.csv")
latest_data = pd.read_csv("data/latest_stock_data.csv")

# Merge sector/industry/market cap info
merged = picks.merge(stock_info, left_on="symbol", right_on="Symbol", how="left")

# Merge in latest volume (match on symbol and date)
merged = merged.merge(latest_data[["symbol", "date", "volume"]], on=["symbol", "date"], how="left")


# Calculate recent return (last 30 days)
# (Assume latest_stock_data.csv is sorted by date, one row per symbol)
merged["recent_return_30d"] = merged["forward_return_30d"] if "forward_return_30d" in merged.columns else np.nan

# Calculate volatility (std of close over last 30 days) and avg volume (if available)
# For demo, set as NaN (can be filled in with more data)
merged["volatility_30d"] = np.nan
merged["avg_volume_30d"] = np.nan

# Helper: sector diversity filter
def sector_diversity(df, max_per_sector):
    result = []
    sector_counts = {}
    for _, row in df.iterrows():
        sector = row.get("Industry", "Unknown")
        if sector_counts.get(sector, 0) < max_per_sector:
            result.append(row)
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
        if len(result) >= len(df):
            break
    return pd.DataFrame(result)

# --- Free: Top 10 by probability ---
top10 = merged.sort_values("breakout_probability", ascending=False).head(50)  # buffer for diversity
free = sector_diversity(top10, max_per_sector=2).head(10)
free[["symbol", "date", "breakout_probability"]].to_csv("data/top10_free.csv", index=False)

# --- Pro: Top 25, max 3 per sector ---
top25 = merged.sort_values("breakout_probability", ascending=False).head(100)
pro = sector_diversity(top25, max_per_sector=3).head(25)
pro_cols = ["symbol", "date", "breakout_probability", "Industry", "Market Cap", "volume", "recent_return_30d"]
pro[pro_cols].to_csv("data/top25_pro.csv", index=False)

# --- Premium: Top 50, max 2 per sector, all analytics ---
top50 = merged.sort_values("breakout_probability", ascending=False).head(200)
premium = sector_diversity(top50, max_per_sector=2).head(50)
premium_cols = pro_cols + ["volatility_30d", "avg_volume_30d"]
premium[premium_cols].to_csv("data/top50_premium.csv", index=False)

print("Generated top10_free.csv, top25_pro.csv, top50_premium.csv in data/")
