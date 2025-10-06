# 🔧 Railway Deployment Troubleshooting

## ⚠️ IMPORTANT: Railway Interface Update

**Railway no longer offers direct "Dockerfile" selection in the builder dropdown!**

The current Railway interface only provides:
- ✅ **Nixpacks** (recommended - use with `nixpacks-*.toml` config)
- ❌ **Railpack** (fails with multiple Python files)
- ⚠️ **Custom Build Command** (advanced)

**All Dockerfile references in old documentation are outdated.**

This guide has been updated to use **Nixpacks with custom config files**.

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

### Solution 1: Use Nixpacks with Custom Config File (Recommended)

**Railway's Current Interface** only offers:
- Nixpacks (recommended)
- Railpack (fails for multi-file projects)
- Custom Build Command

**There is NO "Dockerfile" option in the builder dropdown anymore.**

1. **Go to Railway Dashboard**
   - Navigate to your service (e.g., `pattern-detection-api`)
   - Click **Settings** tab

2. **Set Nixpacks Config File**
   - Scroll to **"Build"** section
   - Look for **"Nixpacks Config File"** or **"Config File Path"** field
   - For Pattern Detection: Enter `nixpacks-pattern.toml`
   - For CrewAI Service: Enter `nixpacks-crewai.toml`

3. **What This Does**
   - Tells Nixpacks which dependencies to install
   - Specifies the correct start command
   - Uses Python 3.12
   - Installs only the required packages for that service

4. **Save & Redeploy**
   - Changes save automatically
   - Click **"Redeploy"** button at top
   - OR push a new commit to trigger deployment

**Nixpacks Config Files in Repo:**
- `nixpacks-pattern.toml` - For Pattern Detection API
- `nixpacks-crewai.toml` - For CrewAI Service

### Solution 2: Use Custom Start Command

If Nixpacks config file doesn't work:

1. **Settings → Deploy** (not Build)
2. Look for **"Custom Start Command"** field
3. For Pattern Detection, enter:
   ```bash
   pip install -r python/requirements-ml.txt && uvicorn python.pattern_detection_api:app --host 0.0.0.0 --port $PORT
   ```
4. For CrewAI, enter:
   ```bash
   pip install -r crewai-service/requirements.txt && cd crewai-service && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Redeploy

**Note**: This installs dependencies on every startup (slower)

### Solution 3: Use railway.toml Root Config

Railway can use a `railway.toml` file for configuration:

**For Pattern Detection API:**
Create `railway.toml` in root (if only deploying this service):
```toml
[build]
nixpacksConfigPath = "nixpacks-pattern.toml"

[deploy]
startCommand = "uvicorn python.pattern_detection_api:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "on_failure"
```

**⚠️ Warning**: This only works if deploying ONE service. For multiple services, use Solution 1 (Nixpacks config per service).

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
Builder: Nixpacks (default)
Nixpacks Config File: nixpacks-pattern.toml
OR
Custom Start Command: pip install -r python/requirements-ml.txt && uvicorn python.pattern_detection_api:app --host 0.0.0.0 --port $PORT
```

**For CrewAI Service:**
```
Builder: Nixpacks (default)
Nixpacks Config File: nixpacks-crewai.toml
OR
Custom Start Command: pip install -r crewai-service/requirements.txt && cd crewai-service && uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Verification Steps

### 1. Check Build Logs

After redeploying, check the build logs:

**Good logs (using Nixpacks with config):**
```
=> Using Nixpacks config from: nixpacks-pattern.toml
=> Installing nixPkgs: python312, gcc, pkg-config
=> Running install phase
=> pip install -r python/requirements-ml.txt
=> Successfully installed...
=> Starting: uvicorn python.pattern_detection_api:app
✅ Build successful
```

**Bad logs (using Railpack):**
```
Railpack could not determine how to build the app.
The following languages are supported:
...
❌ Build failed
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
