# Svelte Chart App - Environment Configuration

## For Local Development

Create a `.env` file in your Svelte Chart App root:

```env
# Local Pattern Detection API
VITE_API_URL=http://localhost:8003
VITE_WS_URL=ws://localhost:8003
```

## For Production (Vercel)

Set these environment variables in your Vercel project settings:

```env
# Production Pattern Detection API on Render
VITE_API_URL=https://pattern-detection-api.onrender.com
VITE_WS_URL=wss://pattern-detection-api.onrender.com
```

**Note**: Replace with your actual Render URL once deployed.

## Testing the Connection

### 1. Test REST API
```bash
# Get top stock picks
curl https://pattern-detection-api.onrender.com/api/picks/top/10

# Get stock details
curl https://pattern-detection-api.onrender.com/api/stock/AAPL

# Get pattern history
curl https://pattern-detection-api.onrender.com/api/patterns/AAPL?timeframe=1d&days=7
```

### 2. Test WebSocket (Browser Console)
```javascript
const ws = new WebSocket('wss://pattern-detection-api.onrender.com/ws/live/AAPL?timeframe=1d');

ws.onopen = () => console.log('✅ Connected');
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log('📊 Received:', data.type, data);
};
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = () => console.log('🔴 Disconnected');
```

## Deployment Steps

### 1. Update Render Service

The Pattern Detection API now includes:
- ✅ WebSocket endpoint: `/ws/live/{symbol}`
- ✅ REST endpoints: `/api/picks/top/{count}`, `/api/stock/{symbol}`, `/api/patterns/{symbol}`
- ✅ Real-time market data from Yahoo Finance
- ✅ Pattern detection on live data

### 2. Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Svelte Chart App project
3. Go to Settings → Environment Variables
4. Add/Update:
   - `VITE_API_URL`: Your Render API URL (https)
   - `VITE_WS_URL`: Your Render WebSocket URL (wss)
5. Redeploy the project

### 3. Verify Deployment

1. Check Render logs for WebSocket connections
2. Open Svelte app in browser
3. Open browser DevTools (F12) → Console
4. You should see: `✅ WebSocket connected for AAPL (1d)`
5. Chart should display real-time data

## Troubleshooting

### WebSocket Connection Fails

**Check CORS**: Ensure Pattern Detection API allows your Vercel domain
```python
# In pattern_detection_api.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://svelte-chart-app.vercel.app"],  # Add your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### No Data Showing

1. **Check Render service is running**: Visit `https://your-app.onrender.com/health`
2. **Check browser console**: Look for error messages
3. **Check Render logs**: Look for connection messages and errors
4. **Verify environment variables**: Ensure correct URLs in Vercel

### Slow Updates

- Free tier on Render may have cold starts (first request takes ~30s)
- Yahoo Finance API has rate limits
- Consider upgrading Render plan for better performance

## Market Data Sources

Currently using **Yahoo Finance** (via yfinance library):
- ✅ Free
- ✅ No API key required
- ✅ Good historical data
- ⚠️ Rate limits apply
- ⚠️ 15-minute delay on some data

### Alternative Data Sources

If you need real-time data without delays, consider:

1. **Alpha Vantage** - Free tier: 100 requests/day
2. **Finnhub** - Free tier: 60 calls/minute
3. **Polygon.io** - Free tier: 5 API calls/minute
4. **IEX Cloud** - Free tier available

To switch data sources, modify the market data functions in `pattern_detection_api.py`.

## Performance Optimization

### For Render Free Tier

1. **Keep service warm**: Use a service like UptimeRobot to ping every 5 minutes
2. **Optimize queries**: Cache frequently requested data
3. **Limit concurrent connections**: Set max WebSocket connections

### For Production

1. **Upgrade to paid plan**: Faster cold starts, more resources
2. **Use Redis cache**: Cache market data and patterns
3. **Add CDN**: For static assets
4. **Implement rate limiting**: Prevent abuse

---

**Created**: October 6, 2025  
**Status**: Configuration Ready ✅
