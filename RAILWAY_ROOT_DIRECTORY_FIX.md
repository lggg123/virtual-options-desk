# Railway Root Directory Configuration Fix

## Problem
When deploying Pattern Detection or CrewAI services to Railway, you get:
```
Nixpacks was unable to generate a build plan for this app.
Using subdirectory "__pycache__"
```

## Root Cause
- Repository has two Python services in different folders (`python/` and `crewai-service/`)
- Railway's Nixpacks auto-detection gets confused by multiple Python directories
- It may pick `__pycache__` or the wrong folder

## Solution: Set Root Directory for Each Service

### Pattern Detection Service

**Settings → General:**
- Root Directory: `python`

**Settings → Build:**
- Builder: `NIXPACKS`
- Nixpacks Config File: `../nixpacks-pattern.toml`

**Why `../`?** The config file is in the repo root, but Railway builds from `python/` directory, so we reference it with `../`.

### CrewAI Service

**Settings → General:**
- Root Directory: `crewai-service`

**Settings → Build:**
- Builder: `NIXPACKS`
- Nixpacks Config File: `../nixpacks-crewai.toml`

**Settings → Variables:**
- `OPENAI_API_KEY=your-key-here` (required)

## File Structure

```
Repository Root
├── nixpacks-pattern.toml          ← Accessed via ../
├── nixpacks-crewai.toml           ← Accessed via ../
├── python/                        ← Root Directory for Pattern Detection
│   ├── requirements-ml.txt
│   ├── pattern_detection_api.py
│   └── pattern_detector.py
└── crewai-service/                ← Root Directory for CrewAI
    ├── requirements.txt
    └── main.py
```

## What Changed in Nixpacks Configs

### Before (❌ Doesn't Work)
```toml
[phases.install]
cmds = ["pip install -r python/requirements-ml.txt"]

[start]
cmd = "uvicorn python.pattern_detection_api:app"
```

### After (✅ Works)
```toml
[phases.install]
cmds = ["pip install -r requirements-ml.txt"]  # No python/ prefix!

[start]
cmd = "uvicorn pattern_detection_api:app"  # No python. prefix!
```

**Why?** Because Root Directory is `python`, Railway is already inside that folder.

## Common Mistakes

❌ Root Directory blank → Auto-detection fails  
❌ Root Directory `python/` with trailing slash  
❌ Nixpacks Config `nixpacks-pattern.toml` without `../`  
❌ Using `python/` prefix in paths inside config

✅ Root Directory `python` no trailing slash  
✅ Nixpacks Config `../nixpacks-pattern.toml`  
✅ Paths relative to root directory (no `python/` prefix)

## Testing

After deployment, check the build logs:
```
✓ Using Nixpacks
✓ Loading config from ../nixpacks-pattern.toml
✓ Installing dependencies from requirements-ml.txt
✓ Starting uvicorn server
```

Test the endpoint:
```bash
curl https://your-service.up.railway.app/health
```

## Next Steps

See `DEPLOY_NOW.md` for complete deployment walkthrough with all services.
