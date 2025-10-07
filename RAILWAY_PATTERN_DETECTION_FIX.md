# 🚨 Railway Pattern Detection - Complete Fix

## Problem: Using subdirectory "__pycache__"

Railway keeps building from the wrong directory.

## THE FIX:

### Step 1: Set Root Directory (CRITICAL!)
**Settings → General → Root Directory**: `python`

⚠️ This is THE most important setting! Without it, nothing works.

### Step 2: SKIP Custom Build Command
**Settings → Build → Custom Build Command**: Leave EMPTY

Let Nixpacks handle the build using the config file.

### Step 3: Set Custom Start Command
**Settings → Deploy → Custom Start Command**: `./start.sh`

### Step 4: Redeploy

---

## Complete Configuration

| Setting | Value |
|---------|-------|
| Root Directory | `python` |
| Builder | NIXPACKS |
| Nixpacks Config File | `../nixpacks-pattern.toml` |
| Custom Build Command | (leave empty) |
| Custom Start Command | `./start.sh` |

---

## Why This Works

- **Root Directory = `python`**: Railway starts inside python/ folder, can't see __pycache__ at wrong level
- **Nixpacks Config**: `../nixpacks-pattern.toml` sets up Python, installs dependencies from requirements-ml.txt
- **Custom Start Command**: `./start.sh` handles PORT variable correctly

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
