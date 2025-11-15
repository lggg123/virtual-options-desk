# 🔧 WebSocket Error 1006 Fix

## Error You're Seeing

```
❌ WebSocket error: Event { isTrusted: true }
🔴 WebSocket disconnected: 1006 
```

**Error Code 1006** = Abnormal Closure - Connection rejected before establishment

## Root Cause

The WebSocket connection from Vercel is being rejected by Railway. This happens even though:
- ✅ Localhost works fine
- ✅ Environment variables are set
- ✅ CORS is configured

## 🔧 Fixes Applied

I've made several fixes to your Railway backend:

### 1. Enhanced Logging
Added detailed logging to track connection attempts:
- Logs when WebSocket upgrade is detected
- Logs all headers being sent
- Logs connection acceptance

### 2. Updated Start Script
Added explicit WebSocket support flags to uvicorn:
```bash
--ws websockets
--log-level info
```

### 3. Created Railway Config Files
- `railway.json` - Deployment configuration
- `railway.toml` - Service settings

## 🚀 Deploy These Changes to Railway

You need to push these changes to Railway:

### Option 1: Railway CLI (Recommended)

```bash
cd /workspaces/virtual-options-desk

# Stage the changes
git add python/pattern_detection_api.py
git add python/start.sh
git add python/railway.json
git add python/railway.toml

# Commit
git commit -m "Fix WebSocket 1006 error - add Railway WS config"

# Push to trigger Railway deployment
git push origin main
```

### Option 2: Railway Dashboard

1. Go to Railway dashboard
2. Your `virtual-options-desk-production` service
3. Click "Redeploy" 
4. Railway will automatically pull latest code

## ⏱️ Wait for Deployment

Railway deployment takes **2-5 minutes**:
1. Building...
2. Deploying...
3. Ready ✓

## 🧪 Test After Deployment

### Test 1: Check Railway Logs

1. Go to Railway Dashboard
2. Click on your service
3. Click "Deployments" → "View Logs"
4. Look for:
   ```
   🔵 WebSocket connection attempt for AAPL
   ✅ WebSocket ACCEPTED: AAPL (timeframe: 1d)
   ```

### Test 2: Test from Vercel App

1. Visit: https://svelte-chart-app.vercel.app/
2. Open Browser Console (F12)
3. Look for:
   ```
   ✅ WebSocket connected for AAPL (1d)
   📊 Received: historical
   ```

## 🔍 If Still Not Working

### Check 1: Railway Service Running?

Test health endpoint:
```bash
curl https://virtual-options-desk-production.up.railway.app/health
```

Expected: `{"status":"healthy"}`

### Check 2: Check Railway Logs for Errors

Look for:
- `❌ WebSocket accept failed`
- Python tracebacks
- Port binding errors

### Check 3: Railway Domain Configuration

Sometimes Railway needs the custom domain to be re-verified:
1. Go to Settings → Networking
2. Check if domain is active
3. Try generating a new Railway domain

### Check 4: WebSocket Protocol

Verify Svelte app is using `wss://` (not `ws://`):

Check in browser console:
```javascript
console.log('WS URL:', import.meta.env.VITE_WS_URL);
```

Should show: `wss://virtual-options-desk-production.up.railway.app`

## 🐛 Debug: Alternative Test

Test WebSocket directly from browser console:

```javascript
// Test WebSocket connection manually
const testWs = () => {
  const ws = new WebSocket('wss://virtual-options-desk-production.up.railway.app/ws/live/AAPL?timeframe=1d');
  
  ws.onopen = (e) => {
    console.log('✅ MANUAL TEST: Connected!', e);
  };
  
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log('📊 MANUAL TEST: Received', data.type);
  };
  
  ws.onerror = (e) => {
    console.error('❌ MANUAL TEST: Error', e);
  };
  
  ws.onclose = (e) => {
    console.log('🔴 MANUAL TEST: Closed', e.code, e.reason);
  };
};

testWs();
```

### Expected Results:
- **Success**: `✅ MANUAL TEST: Connected!`
- **Still 1006**: Backend issue - check Railway logs
- **Other error**: Network/DNS issue

## 🆘 Common Issues

### Issue 1: Railway Service Sleeping

**Symptom**: First connection takes 20-30 seconds, then works

**Fix**: 
- Railway Free tier sleeps after 5 minutes of inactivity
- First request wakes it up
- Upgrade to Railway Pro for always-on service

**Test**: Make a health check request first
```bash
curl https://virtual-options-desk-production.up.railway.app/health
```
Wait 3 seconds, then try WebSocket connection.

### Issue 2: Port Mismatch

**Symptom**: Connection refused or timeout

**Fix**: Railway sets `PORT` environment variable automatically
- Your start.sh uses `${PORT}`
- This is correct, no changes needed

### Issue 3: Uvicorn WebSocket Support

**Symptom**: Connection closes immediately

**Fix**: Already applied - start.sh now includes `--ws websockets`

### Issue 4: CORS/Origin Blocking

**Symptom**: Connection rejected from Vercel but works from localhost

**Fix**: Already applied - middleware bypasses all checks for WebSocket paths

## 📋 Deployment Checklist

Before testing again:

- [ ] Changes committed to git
- [ ] Changes pushed to GitHub
- [ ] Railway detected new commit
- [ ] Railway finished building (2-5 minutes)
- [ ] Railway deployment shows "Ready"
- [ ] Health check returns 200
- [ ] Railway logs show startup messages

## 🎯 Expected Railway Logs

After successful deployment, logs should show:

```
=== Pattern Detection API Startup ===
PORT environment variable: 8000
Using system Python
Python version: Python 3.11.x
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

When WebSocket connects:
```
🔵 WebSocket connection attempt for AAPL
🔵 Client: ('x.x.x.x', xxxxx)
🔵 Timeframe: 1d
✅ WebSocket ACCEPTED: AAPL (timeframe: 1d)
Fetching historical data for AAPL...
Sending 100 historical candles
```

## 📞 Still Stuck?

If WebSocket still shows 1006 after deploying:

1. **Share Railway Logs**: Copy last 100 lines from Railway deployment logs
2. **Share Browser Console**: Full error output from browser
3. **Test Health Endpoint**: Does `curl` to `/health` work?
4. **Check Railway Status**: Any service outages?

## ✅ Success Indicators

You'll know it's working when:

### Railway Logs Show:
```
✅ WebSocket ACCEPTED: AAPL
📊 Sending historical data
```

### Browser Console Shows:
```
✅ WebSocket connected for AAPL (1d)
📊 Received: historical
📈 Got 100 candles
```

### Vercel App Shows:
- 🟢 Live (green indicator)
- Real-time candlestick chart
- Pattern detection cards

---

## 🚀 Quick Summary

1. **Commit** the changes to git
2. **Push** to trigger Railway deployment
3. **Wait** 2-5 minutes for Railway to deploy
4. **Test** Vercel app - should show 🟢 Live
5. **Check** Railway logs if still issues

The changes I made should fix the WebSocket 1006 error. The key fixes are:
- Better error handling in WebSocket accept
- Explicit WebSocket protocol support in uvicorn
- Enhanced logging to debug connection attempts
- Railway configuration files

Good luck! 🎉
