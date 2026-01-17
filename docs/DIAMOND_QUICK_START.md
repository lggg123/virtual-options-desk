# Diamond Architecture: Quick Start Checklist

**Goal**: Get Phase 1 (Qlib Data Layer) running in 2 weeks

---

## Week 1: Setup & Validation

### Day 1: Environment Preparation
- [ ] **Review Documentation**
  - [ ] Read [DIAMOND_ARCHITECTURE_ROADMAP.md](./DIAMOND_ARCHITECTURE_ROADMAP.md)
  - [ ] Read [DIAMOND_INTEGRATION_SUMMARY.md](./DIAMOND_INTEGRATION_SUMMARY.md)
  - [ ] Watch [TradingAgents Video](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

- [ ] **Validate Prerequisites**
  - [ ] Python 3.10+ installed: `python --version`
  - [ ] 10GB+ free disk space: `df -h`
  - [ ] 4GB+ RAM available: `free -h`
  - [ ] Internet connection for data downloads

### Day 2: Qlib Installation
- [ ] **Install Qlib**
  ```bash
  cd /workspaces/virtual-options-desk
  pip install pyqlib
  pip install qlib-server qlib-client
  ```

- [ ] **Download Sample Data**
  ```bash
  python -c "import qlib; from qlib.data import D; qlib.init()"
  ```

- [ ] **Test Installation**
  ```bash
  python -c "import qlib; print('Qlib version:', qlib.__version__)"
  ```

### Day 3: Data Download
- [ ] **Create Data Directory**
  ```bash
  mkdir -p qlib-data/{stock_data,crypto_data,options_data}
  ```

- [ ] **Download US Stock Data**
  ```bash
  python -c "
  from qlib.data import D
  import qlib
  
  # Initialize with custom data path
  qlib.init(provider_uri='./qlib-data/stock_data')
  
  # Download data for major symbols
  from qlib.contrib.data.handler import fetch_data
  fetch_data(market='us', symbols=['AAPL', 'MSFT', 'GOOGL', 'SPY', 'QQQ'])
  "
  ```

- [ ] **Verify Data**
  ```bash
  ls -lh qlib-data/stock_data/
  # Should see downloaded files
  ```

### Day 4: Create Qlib Service
- [ ] **Create Service File**
  ```bash
  touch python/qlib_service.py
  ```

- [ ] **Add Basic Implementation**
  ```python
  # python/qlib_service.py
  from fastapi import FastAPI, HTTPException
  from fastapi.middleware.cors import CORSMiddleware
  import qlib
  from qlib.data import D
  import uvicorn
  
  app = FastAPI(title="Qlib Data Service")
  
  # CORS for Next.js frontend
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  
  # Initialize Qlib
  qlib.init(provider_uri="./qlib-data/stock_data")
  
  @app.get("/")
  async def root():
      return {"service": "Qlib Data Service", "status": "running"}
  
  @app.get("/features/{symbol}")
  async def get_features(symbol: str, start_date: str = "2024-01-01", end_date: str = "2026-01-17"):
      """Get cleaned OHLCV + technical features for a symbol"""
      try:
          fields = ["$open", "$high", "$low", "$close", "$volume"]
          df = D.features([symbol], fields, start_time=start_date, end_time=end_date)
          
          if df.empty:
              raise HTTPException(status_code=404, detail=f"No data for {symbol}")
          
          return {
              "symbol": symbol,
              "data_points": len(df),
              "features": df.to_dict('records')[:10],  # Return first 10 for testing
              "quality_score": 0.95  # Placeholder
          }
      except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))
  
  if __name__ == "__main__":
      uvicorn.run(app, host="0.0.0.0", port=8004)
  ```

- [ ] **Test Service**
  ```bash
  python python/qlib_service.py &
  curl http://localhost:8004/
  curl http://localhost:8004/features/AAPL
  ```

### Day 5: Frontend Integration
- [ ] **Create API Route**
  ```bash
  mkdir -p frontend/src/app/api/qlib
  touch frontend/src/app/api/qlib/features/route.ts
  ```

- [ ] **Add Route Handler**
  ```typescript
  // frontend/src/app/api/qlib/features/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  
  export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'AAPL';
    
    try {
      const response = await fetch(`http://localhost:8004/features/${symbol}`);
      const data = await response.json();
      
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Qlib service unavailable' }, { status: 500 });
    }
  }
  ```

- [ ] **Test Frontend API**
  ```bash
  curl http://localhost:3000/api/qlib/features?symbol=AAPL
  ```

---

## Week 2: Data Quality & Comparison

### Day 6: Add Technical Indicators
- [ ] **Install TA-Lib**
  ```bash
  pip install ta-lib
  ```

- [ ] **Enhance Qlib Service**
  ```python
  # Add to python/qlib_service.py
  
  @app.get("/features/{symbol}/technical")
  async def get_technical_features(symbol: str):
      """Get technical indicators (RSI, MACD, etc.)"""
      try:
          fields = [
              "$close",
              "$open", 
              "$high",
              "$low",
              "$volume"
          ]
          df = D.features([symbol], fields, start_time="2024-01-01")
          
          # Calculate RSI
          import talib
          closes = df['$close'].values
          rsi = talib.RSI(closes, timeperiod=14)
          macd, signal, hist = talib.MACD(closes)
          
          return {
              "symbol": symbol,
              "current_rsi": float(rsi[-1]),
              "current_macd": float(macd[-1]),
              "rsi_values": rsi[-30:].tolist(),  # Last 30 days
              "macd_values": macd[-30:].tolist()
          }
      except Exception as e:
          raise HTTPException(status_code=500, detail=str(e))
  ```

### Day 7: Data Quality Validation
- [ ] **Create Comparison Script**
  ```bash
  touch python/compare_qlib_yfinance.py
  ```

- [ ] **Add Comparison Logic**
  ```python
  # python/compare_qlib_yfinance.py
  import qlib
  from qlib.data import D
  import yfinance as yf
  import pandas as pd
  
  qlib.init(provider_uri="./qlib-data/stock_data")
  
  def compare_sources(symbol: str):
      # Get Qlib data
      qlib_df = D.features([symbol], ["$close"], start_time="2024-01-01")
      
      # Get Yahoo Finance data
      yf_data = yf.download(symbol, start="2024-01-01", progress=False)
      
      # Compare
      print(f"\n{symbol} Data Comparison:")
      print(f"Qlib records: {len(qlib_df)}")
      print(f"YFinance records: {len(yf_data)}")
      print(f"\nQlib last 5 closes:")
      print(qlib_df['$close'].tail())
      print(f"\nYFinance last 5 closes:")
      print(yf_data['Close'].tail())
      
      # Calculate correlation
      merged = pd.merge(
          qlib_df.reset_index(), 
          yf_data.reset_index(),
          left_on='datetime',
          right_on='Date',
          how='inner'
      )
      correlation = merged['$close'].corr(merged['Close'])
      print(f"\nCorrelation: {correlation:.4f}")
      
      return correlation > 0.99  # Should be nearly identical
  
  if __name__ == "__main__":
      symbols = ['AAPL', 'MSFT', 'GOOGL', 'SPY']
      results = {symbol: compare_sources(symbol) for symbol in symbols}
      
      print("\n=== VALIDATION RESULTS ===")
      all_passed = all(results.values())
      print(f"All symbols passed: {all_passed}")
      if not all_passed:
          print(f"Failed: {[s for s, v in results.items() if not v]}")
  ```

- [ ] **Run Validation**
  ```bash
  python python/compare_qlib_yfinance.py
  ```

### Day 8: Add More Symbols
- [ ] **Expand Symbol List**
  ```python
  # Create python/download_qlib_data.py
  import qlib
  from qlib.contrib.data.handler import fetch_data
  
  qlib.init(provider_uri="./qlib-data/stock_data")
  
  symbols = [
      # Indices
      'SPY', 'QQQ', 'IWM', 'DIA',
      # Mega caps
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
      # Popular stocks
      'AMD', 'NFLX', 'DIS', 'BA', 'JPM', 'V', 'WMT', 'PG',
      # Sector ETFs
      'XLF', 'XLE', 'XLK', 'XLV', 'XLI'
  ]
  
  print(f"Downloading data for {len(symbols)} symbols...")
  for symbol in symbols:
      try:
          fetch_data(market='us', symbols=[symbol])
          print(f"✓ {symbol}")
      except Exception as e:
          print(f"✗ {symbol}: {e}")
  
  print("\nDownload complete!")
  ```

- [ ] **Run Download**
  ```bash
  python python/download_qlib_data.py
  ```

### Day 9: Create Dashboard Page
- [ ] **Create Qlib Dashboard**
  ```bash
  mkdir -p frontend/src/app/dashboard/qlib
  touch frontend/src/app/dashboard/qlib/page.tsx
  ```

- [ ] **Add Dashboard UI**
  ```tsx
  // frontend/src/app/dashboard/qlib/page.tsx
  'use client';
  
  import { useState, useEffect } from 'react';
  
  export default function QlibDashboard() {
    const [symbol, setSymbol] = useState('AAPL');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/qlib/features?symbol=${symbol}`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching Qlib data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    useEffect(() => {
      fetchData();
    }, [symbol]);
    
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Qlib Data Quality Dashboard</h1>
        
        <div className="mb-4">
          <label className="block mb-2">Symbol:</label>
          <select 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)}
            className="border px-4 py-2 rounded"
          >
            <option value="AAPL">AAPL</option>
            <option value="MSFT">MSFT</option>
            <option value="GOOGL">GOOGL</option>
            <option value="SPY">SPY</option>
          </select>
        </div>
        
        {loading && <div>Loading...</div>}
        
        {data && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{data.symbol}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Data Points</p>
                <p className="text-2xl font-bold">{data.data_points}</p>
              </div>
              <div>
                <p className="text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {(data.quality_score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Recent Data Points:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Close</th>
                      <th className="text-right py-2">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.features.slice(0, 5).map((row: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{row.datetime || 'N/A'}</td>
                        <td className="text-right">${row.$close?.toFixed(2)}</td>
                        <td className="text-right">{row.$volume?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Test Dashboard**
  ```
  Visit: http://localhost:3000/dashboard/qlib
  ```

### Day 10: Documentation & Cleanup
- [ ] **Document Qlib Setup**
  ```bash
  touch docs/QLIB_SETUP_GUIDE.md
  ```

- [ ] **Create PoC Results**
  ```bash
  touch docs/QLIB_POC_RESULTS.md
  ```

- [ ] **Update README**
  - [ ] Add Qlib section to main README.md
  - [ ] Document new API endpoints
  - [ ] Add dashboard link

- [ ] **Clean Up**
  ```bash
  # Stop test services
  pkill -f qlib_service
  
  # Commit Phase 1 work
  git add .
  git commit -m "feat: Add Qlib data layer (Phase 1 PoC)"
  ```

---

## Success Criteria for Week 2 Completion

✅ **Must Have**:
- [ ] Qlib service running on port 8004
- [ ] API endpoint `/api/qlib/features` working
- [ ] Dashboard showing data for 5+ symbols
- [ ] Validation script confirms Qlib data matches Yahoo Finance (correlation > 0.99)
- [ ] Documentation written

🎯 **Nice to Have**:
- [ ] Technical indicators (RSI, MACD) working
- [ ] 20+ symbols downloaded
- [ ] Automated startup script
- [ ] Error handling for missing data

❌ **Red Flags** (Stop and Reassess):
- [ ] Qlib data significantly different from Yahoo Finance
- [ ] Service crashes frequently
- [ ] Download takes >1 hour for 10 symbols
- [ ] Dashboard doesn't load

---

## After Week 2: Decision Point

### ✅ If Successful → Proceed to Phase 2
- [ ] Schedule Phase 2 kickoff meeting
- [ ] Review [AlphaPy documentation](https://github.com/ScottFreeLLC/AlphaPy)
- [ ] Begin AlphaPy installation

### ⚠️ If Partial Success → Debug & Iterate
- [ ] Document blockers in `QLIB_POC_RESULTS.md`
- [ ] Spend Week 3 fixing issues
- [ ] Retry validation

### ❌ If Failed → Consider Alternatives
- [ ] Evaluate [QuantConnect](https://www.quantconnect.com/) as Qlib alternative
- [ ] Consider simplifying to just yfinance + manual feature engineering
- [ ] Re-assess if Diamond Architecture is right fit

---

## Resources

### Qlib Documentation
- [Official Docs](https://qlib.readthedocs.io/)
- [GitHub Repo](https://github.com/microsoft/qlib)
- [Tutorial Videos](https://www.youtube.com/results?search_query=qlib+tutorial)

### Support
- [Qlib Discord](https://discord.gg/qlib) - Community support
- [GitHub Issues](https://github.com/microsoft/qlib/issues) - Bug reports

### Next Steps
- [ ] Read [DIAMOND_ARCHITECTURE_ROADMAP.md](./DIAMOND_ARCHITECTURE_ROADMAP.md) - Full roadmap
- [ ] Read [DIAMOND_INTEGRATION_SUMMARY.md](./DIAMOND_INTEGRATION_SUMMARY.md) - Integration plan

---

## Daily Standup Template

Use this template to track progress:

```markdown
## Day X: [Date]

### Completed
- [ ] Task 1
- [ ] Task 2

### In Progress
- [ ] Task 3

### Blocked
- [ ] Blocker description

### Tomorrow's Plan
- [ ] Next task

### Notes
- Any observations, learnings, or decisions
```

---

## Troubleshooting Common Issues

### Issue: Qlib installation fails
**Solution**:
```bash
# Try with specific version
pip install pyqlib==0.9.0

# Or from source
git clone https://github.com/microsoft/qlib.git
cd qlib
pip install -e .
```

### Issue: Data download very slow
**Solution**:
```bash
# Download in smaller batches
symbols_batch_1 = ['AAPL', 'MSFT', 'GOOGL']
symbols_batch_2 = ['SPY', 'QQQ', 'IWM']
# Process one batch at a time
```

### Issue: Service won't start on port 8004
**Solution**:
```bash
# Check if port is in use
lsof -i :8004

# Kill existing process
kill -9 <PID>

# Or use different port
uvicorn.run(app, host="0.0.0.0", port=8005)
```

---

**Ready to start? Begin with Day 1 and check off items as you complete them!**

Good luck! 🚀
