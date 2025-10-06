# 🔧 Railway Deployment Troubleshooting

## Error: "Railpack could not determine how to build the app"

### Problem
Railway's auto-detection system (Railpack/Nixpacks) is trying to analyze your code instead of using the Dockerfile you specified.

### Error Message
```
Railpack could not determine how to build the app.

The app contents that Railpack analyzed contains:
./
├── __pycache__/
├── crewai_analysis.py
├── ml_api.py
├── pattern_detection_api.py
...
```

### Root Cause
Railway is not detecting or using your `railway-*.json` config file or Dockerfile. It's falling back to auto-detection, which fails when there are multiple Python entry points.

## Solutions

### Solution 1: Manually Set Builder to Dockerfile (Recommended)

1. **Go to Railway Dashboard**
   - Navigate to your service (e.g., `pattern-detection-api`)
   - Click **Settings** tab

2. **Change Builder**
   - Scroll to **"Build & Deploy"** section
   - Find **"Builder"** dropdown (might show "Nixpacks" or "Auto")
   - Click dropdown → Select **"Dockerfile"**

3. **Set Dockerfile Path**
   - Field: **"Dockerfile Path"**
   - Enter: `Dockerfile.pattern` (for Pattern Detection)
   - OR: `Dockerfile.crewai` (for CrewAI)

4. **Set Build Context** (if needed)
   - Field: **"Docker Build Context"**
   - Value: `.` (dot = root directory)

5. **Save & Redeploy**
   - Changes save automatically
   - Click **"Redeploy"** button at top
   - OR push a new commit to trigger deployment

### Solution 2: Use Railway Config File

If the config file isn't being detected:

1. **Settings → Build & Deploy**
2. Look for **"Railway Config File"** or **"Service Config"** field
3. Enter: `railway-pattern-detection.json` (or `railway-crewai.json`)
4. Redeploy

### Solution 3: Add railway.json to Root

Sometimes Railway only looks for `railway.json` in the root:

**For Pattern Detection API:**
```bash
# Create symlink or copy
cp railway-pattern-detection.json railway.json
git add railway.json
git commit -m "Add railway.json for auto-detection"
git push
```

**For CrewAI Service:**
```bash
cp railway-crewai.json railway.json
```

**⚠️ Warning**: This only works if deploying ONE service. For multiple services, use Solution 1 (manual configuration).

### Solution 4: Verify Dockerfile Location

Make sure your Dockerfile is in the repository root:

```bash
# Check files exist
ls -la Dockerfile.pattern
ls -la Dockerfile.crewai
ls -la railway-pattern-detection.json
ls -la railway-crewai.json
```

All should be in the repository root (not in subdirectories).

## Railway Dashboard Configuration Screenshots

### Where to Find Settings

```
Railway Dashboard
└── Your Project
    └── pattern-detection-api (service)
        ├── Deployments
        ├── Metrics  
        ├── Variables
        └── Settings ← Click here
            └── Build & Deploy ← Scroll to this section
                ├── Builder: [Dropdown]
                ├── Dockerfile Path: [Text field]
                ├── Docker Build Context: [Text field]
                └── Railway Config File: [Text field]
```

### Configuration Values

**For Pattern Detection API:**
```
Builder: Dockerfile
Dockerfile Path: Dockerfile.pattern
Docker Build Context: .
Railway Config File: railway-pattern-detection.json
```

**For CrewAI Service:**
```
Builder: Dockerfile
Dockerfile Path: Dockerfile.crewai
Docker Build Context: .
Railway Config File: railway-crewai.json
```

## Verification Steps

### 1. Check Build Logs

After redeploying, check the build logs:

**Good logs (using Dockerfile):**
```
#1 [internal] load build definition from Dockerfile.pattern
#2 [internal] load .dockerignore
#3 [internal] load metadata for docker.io/library/python:3.12-slim
...
```

**Bad logs (using Railpack):**
```
Railpack could not determine how to build the app.
The following languages are supported:
...
```

### 2. Test Build Locally

```bash
# Test Pattern Detection Dockerfile
docker build -f Dockerfile.pattern -t test-pattern .

# Test CrewAI Dockerfile  
docker build -f Dockerfile.crewai -t test-crewai .

# Run locally
docker run -p 8080:8080 -e PORT=8080 test-pattern
```

### 3. Verify Config Files

```bash
# Check JSON syntax
cat railway-pattern-detection.json | jq .
cat railway-crewai.json | jq .

# Should output valid JSON without errors
```

## Common Issues & Fixes

### Issue: "Dockerfile not found"

**Cause**: Railway looking in wrong directory or wrong filename

**Fix**:
```bash
# Verify filename exactly matches
ls -la Dockerfile.pattern  # Not dockerfile.pattern or Dockerfile.Pattern

# Check it's in repository root
git ls-files | grep Dockerfile.pattern
```

### Issue: "No such file or directory: python/requirements-ml.txt"

**Cause**: Docker build context is wrong

**Fix**:
- Set **Docker Build Context** to `.` (root)
- OR update Dockerfile to use correct path

### Issue: "Multiple services trying to use same config"

**Cause**: Both services using `railway.json`

**Fix**:
- Use manual configuration (Solution 1)
- Each service manually set to its own Dockerfile
- Don't rely on auto-detection for multi-service repos

### Issue: "Build keeps using Nixpacks"

**Cause**: Railway cached the builder choice

**Fix**:
1. Settings → Build & Deploy
2. Change builder to "Dockerfile"
3. Clear Railway cache: Settings → Danger Zone → Clear Build Cache
4. Redeploy

## Multi-Service Setup Reminder

When deploying **multiple services from one repo**:

| Service | Manual Config Required | Railway Config File | Dockerfile |
|---------|----------------------|-------------------|------------|
| Pattern Detection | ✅ Set in dashboard | `railway-pattern-detection.json` | `Dockerfile.pattern` |
| CrewAI Service | ✅ Set in dashboard | `railway-crewai.json` | `Dockerfile.crewai` |

**You MUST manually configure each service** because Railway can't auto-detect which config to use when there are multiple services.

## Quick Fix Checklist

- [ ] Go to Railway service Settings
- [ ] Scroll to "Build & Deploy"  
- [ ] Set "Builder" to "Dockerfile"
- [ ] Set "Dockerfile Path" to correct file
- [ ] Set "Docker Build Context" to `.`
- [ ] Click "Redeploy"
- [ ] Check build logs for Dockerfile usage
- [ ] Verify service starts successfully

## Testing Deployment

After fixing:

```bash
# Wait for deployment to complete
# Then test the service

# Pattern Detection API
curl https://your-service.up.railway.app/health

# Expected response:
# {"status":"healthy","service":"Pattern Detection API"}

# CrewAI Service  
curl https://your-crewai.up.railway.app/health

# Expected response:
# {"status":"healthy","crewai_available":true}
```

## Still Having Issues?

### Check Railway Status
- https://status.railway.app

### Railway Logs
1. Dashboard → Your Service
2. Click "Deployments" tab
3. Click latest deployment
4. View "Build Logs" and "Deploy Logs"

### Railway Community
- Discord: https://discord.gg/railway
- Forum: https://help.railway.app

### GitHub Issues
If Dockerfile builds locally but fails on Railway:
1. Check Railway's GitHub issues
2. May be a platform-specific issue

## Summary

✅ **Always use manual Dockerfile configuration** for multi-service repos

✅ **Don't rely on auto-detection** when you have multiple Python entry points

✅ **Each service needs its own manual configuration** in Railway dashboard

✅ **Test Dockerfiles locally** before pushing to Railway

---

**Updated**: October 6, 2025  
**Applies to**: Railway Platform with Dockerfile builds
