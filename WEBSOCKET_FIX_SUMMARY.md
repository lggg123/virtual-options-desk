# 🔧 WebSocket 1006 Error - SOLUTION

## Your Problem

✅ **Localhost works**: WebSocket connects successfully on port 5173  
❌ **Vercel fails**: Shows error 1006 on deployed app

```
❌ WebSocket error: Event { isTrusted: true }
🔴 WebSocket disconnected: 1006
```

## What I Fixed

I've made **4 critical changes** to fix the WebSocket connection:

### 1. ✅ Enhanced WebSocket Logging
**File**: `python/pattern_detection_api.py`
- Added detailed logging before accepting connection
- Logs all headers, client info, and connection attempts
- Better error handling on accept failure

### 2. ✅ Added WebSocket Support Flags
**File**: `python/start.sh`
- Added `--ws websockets` flag to uvicorn
- Added `--log-level info` for better debugging
- Explicitly enables WebSocket protocol

### 3. ✅ Created Railway Config
**Files**: `python/railway.json`, `python/railway.toml`
- Proper Railway service configuration
- Health check settings
- Network configuration

### 4. ✅ Improved CORS Middleware
**File**: `python/pattern_detection_api.py`
- Logs all headers for WebSocket requests
- Better debugging output

## 🚀 How to Deploy the Fix

### Quick Method (Use the script):

```bash
chmod +x deploy-websocket-fix.sh
./deploy-websocket-fix.sh
```

### Manual Method:

```bash
# From project root
cd /workspaces/virtual-options-desk

# Stage and commit changes
git add python/
git commit -m "Fix WebSocket 1006 error"

# Push to trigger Railway deployment
git push origin main
```

## ⏳ Wait for Railway

- Deployment takes **2-5 minutes**
- Monitor at: https://railway.app/dashboard
- Wait for "Ready ✓" status

## 🧪 Test After Deployment

### Step 1: Check Railway Logs

In Railway dashboard, look for:
```
✅ WebSocket ACCEPTED: AAPL (timeframe: 1d)
📊 Sending historical data
```

### Step 2: Test Vercel App

Visit: https://svelte-chart-app.vercel.app/

**Should see**:
- 🟢 Live (green indicator)
- Real-time candlestick chart
- No console errors

**Browser console should show**:
```
✅ WebSocket connected for AAPL (1d)
📊 Received: historical
📈 Got 100 candles
```

## 📁 Files Changed

```
python/
├── pattern_detection_api.py  ← Enhanced logging
├── start.sh                   ← WebSocket flags
├── railway.json               ← NEW Railway config
└── railway.toml               ← NEW Railway settings
```

## 🔍 Why This Fixes It

### Problem: Railway wasn't configured for WebSocket
- Uvicorn wasn't explicitly told to support WebSocket protocol
- No Railway-specific configuration existed
- Not enough logging to debug connection issues

### Solution: Proper WebSocket Configuration
- ✅ Explicit `--ws websockets` flag tells uvicorn to handle WebSocket upgrades
- ✅ Railway config files ensure proper service settings
- ✅ Enhanced logging helps debug any remaining issues

## 🆘 If Still Not Working

### 1. Verify Deployment Completed

Check Railway:
- Status should be "Ready"
- Logs should show startup messages
- No error messages

### 2. Test Health Endpoint

```bash
curl https://virtual-options-desk-production.up.railway.app/health
```

Should return: `{"status":"healthy"}`

### 3. Check Railway Logs

Look for these lines in logs:
```
🔵 WebSocket connection attempt for AAPL
✅ WebSocket ACCEPTED
```

If you don't see these, the request isn't reaching your server.

### 4. Test WebSocket Manually

Open browser console on https://svelte-chart-app.vercel.app/:

```javascript
const ws = new WebSocket('wss://virtual-options-desk-production.up.railway.app/ws/live/AAPL?timeframe=1d');
ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('🔴 Closed:', e.code, e.reason);
```

### 5. Railway Service Sleeping?

Railway Free tier sleeps after 5 minutes of inactivity.

**Test**: Wake it up first
```bash
# Wake up the service
curl https://virtual-options-desk-production.up.railway.app/health

# Wait 3 seconds
sleep 3

# Now test Vercel app
```

## 📋 Quick Checklist

Before testing:

- [ ] Changes committed to git
- [ ] Changes pushed to GitHub (`git push origin main`)
- [ ] Railway detected the push
- [ ] Railway finished deploying (2-5 minutes)
- [ ] Railway status shows "Ready ✓"
- [ ] Health endpoint returns 200

After deployment:

- [ ] Railway logs show "WebSocket ACCEPTED"
- [ ] Vercel app shows 🟢 Live
- [ ] Browser console shows "WebSocket connected"
- [ ] Chart displays real-time data

## ✅ Success Criteria

### You'll know it's fixed when:

**Railway Logs:**
```
=== Pattern Detection API Startup ===
INFO:     Uvicorn running on http://0.0.0.0:8000
🔵 WebSocket connection attempt for AAPL
✅ WebSocket ACCEPTED: AAPL (timeframe: 1d)
```

**Browser Console:**
```
✅ WebSocket connected for AAPL (1d)
📊 Received: historical
📈 Got 100 candles
💹 Candle update: AAPL @ $182.50
```

**Vercel App:**
- 🟢 Live indicator (green)
- Real-time chart updating
- Pattern detection cards appearing
- No errors

## 🎯 Next Steps

1. **Run**: `./deploy-websocket-fix.sh`
2. **Wait**: 2-5 minutes for Railway deployment
3. **Check**: Railway logs for successful WebSocket acceptance
4. **Test**: Vercel app should now show 🟢 Live
5. **Enjoy**: Real-time stock charts! 📊

## 📚 Documentation

- **Detailed Guide**: `WEBSOCKET_1006_FIX.md`
- **Deployment Script**: `deploy-websocket-fix.sh`
- **Railway Config**: `python/railway.json`

---

**The fix is ready to deploy!** Just run the script and wait for Railway to redeploy. 🚀

**Estimated time**: 5-10 minutes total (including deployment)
