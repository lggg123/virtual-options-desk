# 🎯 Railway UI Settings - Manual Override Guide

## If Dockerfile Still Not Found

Railway sometimes doesn't read `railway.json` correctly. **Manually set it in the UI:**

---

## Step-by-Step Railway UI Configuration

### 1. Open Your Service
- Go to: https://railway.app/dashboard
- Click on: **pattern-detection-api** service

### 2. Go to Settings Tab
- Click **Settings** in the left sidebar

### 3. Configure Root Directory
```
┌─────────────────────────────────────┐
│ General                              │
├─────────────────────────────────────┤
│ Root Directory: python               │ ← CRITICAL!
└─────────────────────────────────────┘
```

### 4. Configure Build Settings
Scroll to **Build** section:

```
┌─────────────────────────────────────┐
│ Build                                │
├─────────────────────────────────────┤
│ Builder: Dockerfile                  │ ← Select from dropdown
│                                      │
│ Dockerfile Path: Dockerfile         │ ← Type this exactly
│                                      │
│ Custom Build Command: (empty)       │ ← Leave empty
└─────────────────────────────────────┘
```

### 5. Save and Deploy
- Click **Deploy** button at top right
- Or push to GitHub to trigger auto-deploy

---

## Expected Result

Railway should now show in build logs:

```
=== Building with Dockerfile ===

Step 1/10 : FROM python:3.12-slim
 ---> Using cache
 
Step 2/10 : WORKDIR /app
 ---> Using cache
 
Step 3/10 : RUN apt-get update...
 ---> Running in abc123
 
Step 4/10 : COPY requirements-ml.txt ./
 ---> def456
 
Step 5/10 : RUN pip install -r requirements-ml.txt
 ---> Running in ghi789
Collecting xgboost>=2.0.0
Collecting lightgbm>=4.1.0
...
 
Step 6/10 : COPY . /app
 ---> jkl012  ← This copies ml_models/
 
✓ Build succeeded
```

---

## Alternative: Try These Dockerfile Paths

If `Dockerfile` doesn't work, try in this order:

```
Try #1: Dockerfile
Try #2: ./Dockerfile
Try #3: /Dockerfile
```

One of these should work!

---

## Visual Settings Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  RAILWAY SERVICE SETTINGS            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                      ┃
┃  Service Name:                       ┃
┃  └─ pattern-detection-api            ┃
┃                                      ┃
┃  Root Directory:                     ┃
┃  └─ python                ⚠️ CRITICAL┃
┃                                      ┃
┃  Builder:                            ┃
┃  └─ Dockerfile                       ┃
┃                                      ┃
┃  Dockerfile Path:                    ┃
┃  └─ Dockerfile                       ┃
┃                                      ┃
┃  Custom Build Command:               ┃
┃  └─ (empty)                          ┃
┃                                      ┃
┃  Custom Start Command:               ┃
┃  └─ (empty - from Dockerfile)        ┃
┃                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Environment Variables

Don't forget to add in **Variables** tab:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-key
```

**Don't add:** `PORT` (Railway sets automatically)

---

## Verification Checklist

After deploying, check:

- [ ] Build logs show "Step 1/10 : FROM python:3.12-slim"
- [ ] Build logs show "Step 6/10 : COPY . /app"
- [ ] Deployment logs show "Loading ML models..."
- [ ] Deployment logs show "Uvicorn running on..."
- [ ] Health endpoint works: `/health`
- [ ] Swagger docs work: `/docs`
- [ ] ML predictions work: `/api/ml/screen`

---

## Common Mistakes to Avoid

❌ **Wrong:** Root Directory = `.` or empty
✅ **Right:** Root Directory = `python`

❌ **Wrong:** Dockerfile Path = `python/Dockerfile`
✅ **Right:** Dockerfile Path = `Dockerfile`

❌ **Wrong:** Custom Build Command = `docker build ...`
✅ **Right:** Custom Build Command = (empty)

❌ **Wrong:** Setting PORT environment variable
✅ **Right:** Let Railway set PORT automatically

---

## Still Not Working?

### Last Resort Option 1: Delete railway.json

```bash
git rm python/railway.json
git commit -m "Remove railway.json, using Railway UI config"
git push origin main
```

Then set everything in Railway UI as shown above.

### Last Resort Option 2: Contact Railway Support

If Railway UI settings don't work, it might be a Railway bug. Check:
- Railway Status: https://status.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app

---

## Success Indicators

✅ **Build logs:**
```
Step 1/10 : FROM python:3.12-slim
...
Step 6/10 : COPY . /app
Successfully built abc123
Successfully tagged service:latest
```

✅ **Deployment logs:**
```
Loading ML models from ml_models/...
✓ XGBoost loaded (217KB)
✓ Random Forest loaded (9.1MB)
✓ LightGBM loaded (1.4MB)
✓ LSTM loaded (819KB)
Uvicorn running on http://0.0.0.0:8080
```

✅ **Health check:**
```bash
$ curl https://your-service.railway.app/health
{"status":"healthy","ml_enabled":true}
```

---

**TL;DR: Set it manually in Railway UI Settings → Build:**
- Root Directory: `python`
- Builder: `Dockerfile`
- Dockerfile Path: `Dockerfile`

Then redeploy! 🚀
