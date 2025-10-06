# 🚀 Render Deployment Guide

Complete guide to deploying your Python backend services to Render.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: Have your Supabase credentials ready

---

## 🎯 What We're Deploying

Two Python FastAPI services:
1. **Pattern Detection API** (Port assigned by Render)
2. **ML Stock Screening API** (Port assigned by Render)

Both will be deployed on Render's **free tier** (750 hours/month each).

---

## 🔧 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Connect to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository: `lggg123/virtual-options-desk`
4. Render will automatically detect `render.yaml`

### Step 3: Review Services

Render will show you two services to deploy:
- ✅ `pattern-detection-api` (Web Service)
- ✅ `ml-stock-screening-api` (Web Service)

Click **"Apply"** to deploy both services.

### Step 4: Wait for Build

Build process (~5-10 minutes):
```
Installing dependencies...
✓ numpy, pandas, scikit-learn
✓ fastapi, uvicorn
✓ xgboost, lightgbm
✓ opencv-python
Starting service...
✓ Service live at https://[your-service].onrender.com
```

### Step 5: Get Your API URLs

After deployment, you'll have:
```
Pattern Detection API:
https://pattern-detection-api-[random].onrender.com

ML Stock Screening API:
https://ml-stock-screening-api-[random].onrender.com
```

---

## 🔐 Environment Variables (Optional)

If you need to add environment variables later:

1. Go to service in Render dashboard
2. Click **"Environment"** tab
3. Add variables:

```env
# For Supabase integration (if needed)
SUPABASE_URL=https://nxgtznzhnzlfcofkfbay.supabase.co
SUPABASE_KEY=your_service_role_key

# For API keys (future)
API_KEY=your_api_key_here
```

---

## ✅ Testing Your Deployed Services

### Test Pattern Detection API

```bash
# Health check
curl https://pattern-detection-api-[random].onrender.com/health

# Detect patterns
curl -X POST https://pattern-detection-api-[random].onrender.com/api/patterns/detect \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1d",
    "period": "6mo"
  }'
```

### Test ML Stock Screening API

```bash
# Health check
curl https://ml-stock-screening-api-[random].onrender.com/health

# Get predictions (if models are trained)
curl https://ml-stock-screening-api-[random].onrender.com/api/predictions
```

---

## 📱 Update Your iOS App

After deployment, update your iOS app configuration:

```swift
// In your Config.swift or similar

struct APIConfig {
    // Production URLs from Render
    static let patternAPI = "https://pattern-detection-api-[random].onrender.com"
    static let mlAPI = "https://ml-stock-screening-api-[random].onrender.com"
    
    // Supabase stays the same
    static let supabaseURL = "https://nxgtznzhnzlfcofkfbay.supabase.co"
    static let supabaseAnonKey = "your_anon_key"
}
```

---

## ⚡ Free Tier Limitations

### What's Included (Free):
- ✅ 750 hours/month per service (plenty for development)
- ✅ 512MB RAM
- ✅ Automatic HTTPS
- ✅ Automatic deployments from GitHub
- ✅ Free SSL certificates

### Limitations:
- ⚠️ **Cold starts**: Services spin down after 15 minutes of inactivity
  - First request after inactivity: ~30-60 seconds
  - Subsequent requests: Normal speed
- ⚠️ **512MB RAM limit**: Should be fine for your services
- ⚠️ **No persistent storage**: ML models need to be in repo or loaded from external storage

---

## 🎯 Handling Cold Starts

Cold starts are the main downside of free tier. Solutions:

### Option 1: Accept It (Recommended for MVP)
- Mobile apps expect some loading time
- Show a loading indicator
- Users won't mind occasional 30s wait

### Option 2: Keep Services Warm
Use a service like [Cron-Job.org](https://cron-job.org) to ping your APIs every 10 minutes:
```
https://pattern-detection-api-[random].onrender.com/health
https://ml-stock-screening-api-[random].onrender.com/health
```

### Option 3: Upgrade to Paid ($7/month per service)
- No cold starts
- Always-on services
- More RAM (512MB → 2GB+)

---

## 🔄 Automatic Deployments

Every time you push to `main` branch, Render will:
1. Detect changes
2. Rebuild services
3. Deploy automatically
4. Zero downtime deployment

To disable auto-deploy:
1. Go to service settings
2. Turn off "Auto-Deploy"

---

## 📊 Monitoring

### View Logs
1. Go to service in Render dashboard
2. Click "Logs" tab
3. See real-time logs:
```
INFO: Started server process
INFO: Uvicorn running on http://0.0.0.0:10000
INFO: POST /api/patterns/detect
```

### View Metrics
1. Click "Metrics" tab
2. See:
   - Request rate
   - Response times
   - Memory usage
   - CPU usage

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Failed to install dependencies"**
```bash
# Locally test if requirements install
pip install -r python/requirements-ml.txt
```

**Fix**: Remove any problematic packages from `requirements-ml.txt`

### Service Won't Start

**Error: "ModuleNotFoundError"**
- Check imports in `pattern_detection_api.py` and `ml_api.py`
- We've added fallback imports that should work

**Error: "Port already in use"**
- Render assigns `$PORT` automatically
- Make sure your code uses: `--port $PORT`

### API Returns 404

**Check**:
1. Service is running (not "Suspended")
2. URL is correct
3. Endpoint path is correct (`/health`, `/api/patterns/detect`)

### Service Suspended

Free tier services suspend after 90 days of inactivity. To resume:
1. Go to service dashboard
2. Click "Resume Service"

---

## 💰 Cost Optimization

### Current Setup (FREE)
```
Pattern Detection API:    $0/month
ML Stock Screening API:   $0/month
Total:                    $0/month
```

### If You Need to Upgrade
```
Starter plan ($7/month each):
- No cold starts
- 512MB → 2GB RAM
- Priority support

Total: $14/month for both services
```

---

## 🔒 Security Best Practices

### 1. Don't Commit Secrets
```bash
# Add to .gitignore
.env
*.key
credentials.json
```

### 2. Use Environment Variables
Store sensitive data in Render's environment variables, not in code.

### 3. Add API Key Authentication (Future)
```python
# In your FastAPI apps
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

@app.get("/api/protected")
async def protected_route(api_key: str = Security(api_key_header)):
    if api_key != os.getenv("API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid API key")
    return {"data": "protected"}
```

### 4. Enable CORS Properly
Currently set to `allow_origins=["*"]`. In production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-ios-app.com",
        "https://your-nextjs-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

---

## 🚀 Post-Deployment Checklist

- [ ] Both services deployed successfully
- [ ] Health endpoints responding (`/health`)
- [ ] API endpoints tested with curl
- [ ] URLs updated in iOS app
- [ ] Logs checked for errors
- [ ] Cold start time acceptable (<60s)
- [ ] Documentation updated with production URLs

---

## 📚 Next Steps

After successful deployment:

1. **Test from iOS App**: Make sure your app can connect
2. **Monitor Performance**: Check Render metrics
3. **Set Up Monitoring**: Consider UptimeRobot for alerts
4. **Train ML Models**: Once deployed, train your models
5. **Add Authentication**: Implement API keys for security

---

## 🆘 Support

### Render Support
- [Documentation](https://render.com/docs)
- [Community Forum](https://community.render.com)
- [Status Page](https://status.render.com)

### Your Repo Issues
- Create issue on GitHub: `lggg123/virtual-options-desk`
- Check logs in Render dashboard
- Test locally first with: `./start-pattern-service.sh`

---

## 🎉 Success!

Once deployed, your architecture looks like:

```
iOS App
  ↓
  ├─→ Pattern Detection API (Render)
  ├─→ ML Stock Screening API (Render)
  ├─→ Supabase Database (Cloud)
  └─→ Next.js App (Vercel)
```

All free tier, fully functional! 🚀
