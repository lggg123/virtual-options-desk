# 🔧 WebSocket 403 Error - Complete Fix

## Issue
The Svelte chart app at https://svelte-chart-app.vercel.app/ was getting a **403 Forbidden** error when trying to connect to the WebSocket endpoint.

**Error:**
```
WebSocket connection to 'wss://virtual-options-desk-production.up.railway.app/ws/live/AAPL?timeframe=1d' failed: Error during WebSocket handshake: Unexpected response code: 403
```

## Root Cause
The authentication middleware in `pattern_detection_api.py` was being applied to WebSocket connections, even though it should have been bypassed. The middleware was checking for the `upgrade: websocket` header, but Railway's proxy might have been stripping or modifying this header.

## Solution Applied

### 1. Enhanced WebSocket Detection
Updated the middleware to check **both** the upgrade header AND the URL path:

```python
# Before (only checking upgrade header)
if request.headers.get("upgrade") == "websocket":
    return await call_next(request)

# After (checking both conditions)
is_websocket_upgrade = request.headers.get("upgrade", "").lower() == "websocket"
is_websocket_path = request.url.path.startswith("/ws/")

if is_websocket_upgrade or is_websocket_path:
    print(f"✅ Skipping auth for WebSocket connection")
    return await call_next(request)
```

### 2. Added Detailed Logging
Added extensive logging to help debug WebSocket connection attempts:

```python
print(f"🔵 Allowing WebSocket: upgrade={is_websocket_upgrade}, path={is_websocket_path}")
print(f"🔵 Origin: {request.headers.get('origin', 'none')}")
print(f"🔵 Path: {request.url.path}")
```

### 3. Improved CORS Headers
Added the `Access-Control-Allow-Credentials` header for better CORS support:

```python
response.headers["Access-Control-Allow-Credentials"] = "true"
```

## Testing the Fix

### 1. Wait for Railway Deployment
After pushing the fix, Railway will automatically redeploy. Check the deployment status:
- Go to: https://railway.app/project/your-project
- Wait for the "pattern-detection-api" service to show **"Deployed"**
- Check logs for successful startup

### 2. Test WebSocket Connection

#### Option A: Browser Console Test
Open your browser console and run:

```javascript
const ws = new WebSocket('wss://virtual-options-desk-production.up.railway.app/ws/live/AAPL?timeframe=1d');

ws.onopen = () => {
    console.log('✅ WebSocket connected!');
};

ws.onmessage = (event) => {
    console.log('📊 Received:', JSON.parse(event.data));
};

ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
};

ws.onclose = (event) => {
    console.log('🔴 WebSocket closed:', event.code, event.reason);
};
```

**Expected Result:**
- Should log: `✅ WebSocket connected!`
- Should receive historical data message
- Should receive live candle updates

#### Option B: Test from Svelte App
Simply visit: https://svelte-chart-app.vercel.app/

**Expected Behavior:**
- Chart should load with AAPL data
- Connection status should show "Connected"
- Live updates should appear every 60 seconds

### 3. Check Railway Logs

View the logs to see the WebSocket connection attempts:

```bash
# If you have Railway CLI
railway logs --service pattern-detection-api

# Look for these log messages:
# 🔵 Allowing WebSocket: upgrade=True, path=True
# ✅ Skipping auth for WebSocket connection
# 🔵 WebSocket connection attempt for AAPL (timeframe: 1d)
# ✅ WebSocket connection ACCEPTED for AAPL
```

Or check logs in Railway dashboard:
1. Go to your Railway project
2. Click on "pattern-detection-api" service
3. Click on "Logs" tab
4. Look for the WebSocket connection logs

## Expected Log Output

When the Svelte app connects, you should see:

```
🔵 Allowing WebSocket: upgrade=True, path=True
🔵 Origin: https://svelte-chart-app.vercel.app
🔵 Path: /ws/live/AAPL
✅ Skipping auth for WebSocket connection
🔵 WebSocket connection attempt for AAPL (timeframe: 1d)
🔵 Client: <starlette.requests.HTTPConnection object>
🔵 URL: wss://virtual-options-desk-production.up.railway.app/ws/live/AAPL?timeframe=1d
✅ WebSocket connection ACCEPTED for AAPL
📊 Client connected for AAPL (1d) via WebSocket
WebSocket headers: {'host': '...', 'origin': 'https://svelte-chart-app.vercel.app', ...}
```

## Troubleshooting

### Still Getting 403?

1. **Check Railway Environment Variables**
   ```bash
   # Make sure these are set in Railway:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=8003
   ```

2. **Verify Railway Service is Running**
   - Check Railway dashboard
   - Service should show green "Deployed" status
   - Check health endpoint: `https://virtual-options-desk-production.up.railway.app/health`

3. **Check for Middleware Conflicts**
   - The auth middleware should be skipping WebSocket paths
   - Look for "✅ Skipping auth for WebSocket connection" in logs
   - If this log doesn't appear, the middleware isn't detecting the WebSocket

4. **Test with curl (HTTP endpoint)**
   ```bash
   # This should work (HTTP API)
   curl https://virtual-options-desk-production.up.railway.app/api/patterns/AAPL?timeframe=1d&days=7
   ```

### Alternative: Remove Authentication for WebSocket Entirely

If the issue persists, you can completely disable authentication for WebSocket endpoints by adding this at the top of the auth middleware:

```python
# In pattern_detection_api.py, in auth_middleware_wrapper function:
@app.middleware("http")
async def auth_middleware_wrapper(request: Request, call_next):
    # ALWAYS skip auth for WebSocket paths (no conditions)
    if "/ws/" in request.url.path:
        return await call_next(request)
    
    # ... rest of the middleware
```

## Success Criteria

✅ Svelte app loads without errors  
✅ Chart displays AAPL candlestick data  
✅ Connection status shows "Connected"  
✅ Live updates appear (check console logs)  
✅ No 403 errors in browser console  
✅ Railway logs show successful WebSocket connections  

## Related Files

- `/workspaces/virtual-options-desk/python/pattern_detection_api.py` - Main API file with middleware
- `/workspaces/virtual-options-desk/python/subscription_middleware.py` - Auth middleware
- `/workspaces/virtual-options-desk/SVELTE_WEBSOCKET_FIX.md` - Previous fix attempt

## Next Steps

1. ✅ Code pushed to GitHub (triggers Railway deployment)
2. ⏳ Wait for Railway to redeploy (usually 2-3 minutes)
3. 🧪 Test the WebSocket connection from browser console
4. 🎨 Verify Svelte app works at https://svelte-chart-app.vercel.app/
5. 📊 Check Railway logs for successful connections

---

**Last Updated:** October 8, 2025  
**Status:** Fix deployed, waiting for Railway deployment to complete  
**Railway Service:** pattern-detection-api  
**Svelte App:** https://svelte-chart-app.vercel.app/
