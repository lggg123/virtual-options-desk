# 🚨 Railway Pattern Detection - Complete Fix

## Problem: Using subdirectory "__pycache__"

Railway keeps building from the wrong directory.

## THE FIX:

### Step 1: Set Root Directory (CRITICAL!)
**Settings → General → Root Directory**: `python`

⚠️ This is THE most important setting! Without it, nothing works.

### Step 2: Set Custom Build Command  
**Settings → Build → Custom Build Command**:
```bash
pip install --upgrade pip setuptools wheel && pip install -r requirements-ml.txt && chmod +x start.sh
```

### Step 3: Set Custom Start Command
**Settings → Deploy → Custom Start Command**: `./start.sh`

### Step 4: Redeploy

---

## Complete Configuration

| Setting | Value |
|---------|-------|
| Root Directory | `python` |
| Custom Build Command | `pip install --upgrade pip setuptools wheel && pip install -r requirements-ml.txt && chmod +x start.sh` |
| Custom Start Command | `./start.sh` |
| Nixpacks Config | `../nixpacks-pattern.toml` (optional) |

---

## Why This Works

- **Root Directory = `python`**: Railway starts inside python/ folder, can't see __pycache__ at wrong level
- **Custom Build**: Installs dependencies directly, bypasses nixpacks detection
- **Custom Start**: Runs start.sh which handles PORT variable correctly

---

## Expected Logs After Fix

```
✓ Installing dependencies from requirements-ml.txt
✓ Build succeeded
=== Pattern Detection API Startup ===
PORT environment variable: 8080
INFO:     Uvicorn running on http://0.0.0.0:8080
```

No more "__pycache__" errors!
