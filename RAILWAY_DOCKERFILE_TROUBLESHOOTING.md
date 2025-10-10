# 🚨 Railway Dockerfile Not Found - Solutions

## Issue
Railway build logs showing: "Dockerfile doesn't exist"

## Root Cause
Railway's root directory is `python`, but it's not finding the Dockerfile even though it exists at `python/Dockerfile`.

---

## Solution 1: Update railway.json (DONE) ✅

Changed `dockerfilePath` from `"Dockerfile"` to `"./Dockerfile"`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "./Dockerfile"
  }
}
```

**Try this first after pushing.**

---

## Solution 2: Railway UI Override (Recommended if Solution 1 fails)

### In Railway Dashboard:

1. Go to your service → **Settings** tab
2. Find **Build** section
3. **Manually set:**

```
Builder: Dockerfile
Dockerfile Path: Dockerfile
```

(or try: `./Dockerfile`)

4. **Delete** the `railway.json` file if Railway still ignores it
5. Click **Deploy** to rebuild

---

## Solution 3: Try Different Path Formats

If Railway still can't find it, try these in Railway UI Settings → Build → Dockerfile Path:

```
Option 1: Dockerfile
Option 2: ./Dockerfile
Option 3: /Dockerfile
Option 4: python/Dockerfile  (if Railway is looking from repo root somehow)
```

---

## Solution 4: Rename to Standard Name

Railway might be case-sensitive or looking for specific names:

```bash
# Make sure it's exactly "Dockerfile" (capital D, no extension)
cd python
ls -la Dockerfile

# Should show:
-rw-rw-rw- 1 user user 1083 Oct 10 01:31 Dockerfile
```

---

## Solution 5: Remove railway.json (Let Railway Auto-Detect)

Sometimes Railway's auto-detection works better:

```bash
# Remove the config file
rm python/railway.json

# Let Railway auto-detect
# It should find Dockerfile automatically when:
# - Root Directory: python
# - Dockerfile exists in that directory
```

Then in Railway UI:
- **Don't** set custom Dockerfile path
- Let Railway find it automatically

---

## Solution 6: Use Nixpacks with Custom Install

If Dockerfile continues to fail, we can use Nixpacks but add a custom install command:

In Railway UI → Settings → Build:

```
Custom Build Command:
pip install -r requirements-ml.txt

Custom Install Command:
(leave empty)
```

Then add a `nixpacks.toml` in `python/` directory:

```toml
[phases.setup]
nixPkgs = ["python312", "gcc", "g++"]

[phases.install]
cmds = ["pip install -r requirements-ml.txt"]

[start]
cmd = "uvicorn pattern_detection_api:app --host 0.0.0.0 --port ${PORT:-8080}"
```

**But this won't copy ml_models/** - so Dockerfile is still preferred!

---

## Debugging Steps

### 1. Check Railway Build Logs

Look for these exact messages:

```
❌ "Dockerfile doesn't exist"
   → Railway can't find python/Dockerfile

❌ "Using Nixpacks"
   → Railway is ignoring railway.json

✅ "Step 1/10 : FROM python:3.12-slim"
   → Railway found and is using Dockerfile!
```

### 2. Verify Files Are Committed

```bash
git ls-files python/Dockerfile python/railway.json

# Should show:
python/Dockerfile
python/railway.json
```

### 3. Check Railway Service Settings

In Railway Dashboard → Your Service:
- Root Directory: `python` ✅
- No custom build command (empty)
- No custom Dockerfile path (or set to `Dockerfile`)

---

## Quick Fix Script

Try this in Railway UI Settings → Build:

```
Root Directory: python
Builder: Dockerfile
Dockerfile Path: Dockerfile

(Leave all other fields empty)
```

Then click **Redeploy**.

---

## Last Resort: Manual Dockerfile in Root

If Railway absolutely cannot find it in the `python/` directory:

```bash
# Copy Dockerfile to repo root
cp python/Dockerfile ./Dockerfile.railway

# Update paths in Dockerfile
# Change: COPY requirements-ml.txt ./
# To:     COPY python/requirements-ml.txt ./
# Change: COPY . /app
# To:     COPY python/ /app

# Update Railway settings:
# Root Directory: (empty - use repo root)
# Dockerfile Path: Dockerfile.railway
```

But this is NOT ideal - better to fix the python/ directory approach.

---

## Current Status

- ✅ `python/Dockerfile` exists and is committed
- ✅ `python/railway.json` updated with `"./Dockerfile"`
- ⏳ Pushing to trigger new build
- ⏳ Check Railway logs to see if it finds Dockerfile now

---

## What to Do Next

1. **Push the updated railway.json:**
   ```bash
   git add python/railway.json
   git commit -m "Fix: Update Dockerfile path to ./Dockerfile"
   git push origin main
   ```

2. **Watch Railway build logs**
   - Look for "Step 1/10 : FROM python:3.12-slim"
   - If still says "Dockerfile doesn't exist", try Solution 2

3. **If still failing:**
   - Try setting Dockerfile path manually in Railway UI (Solution 2)
   - Or remove railway.json and let Railway auto-detect (Solution 5)

---

**Most likely to work: Railway UI manual override (Solution 2)**

Sometimes Railway's config file parsing is buggy, and manually setting it in the UI works better.
