# Railway Custom Start Command - Alternative Solution

If the nixpacks start.sh approach still doesn't work, use Railway's **Custom Start Command** instead.

## Pattern Detection API

### Settings → Deploy → Custom Start Command

```bash
bash -c 'PORT=${PORT:-8000} && uvicorn pattern_detection_api:app --host 0.0.0.0 --port $PORT'
```

Or even simpler:

```bash
./start.sh
```

Or most reliable (using Python):

```bash
python -c "import os; os.system(f'uvicorn pattern_detection_api:app --host 0.0.0.0 --port {os.environ.get(\"PORT\", 8000)}')"
```

### Configuration Summary

**Settings → General:**
- Root Directory: `python`

**Settings → Build:**
- Builder: `NIXPACKS`
- Nixpacks Config File: `../nixpacks-pattern.toml`

**Settings → Deploy:**
- Custom Start Command: `./start.sh`

⚠️ **Important**: Setting a Custom Start Command **overrides** the `[start]` section in nixpacks config!

## CrewAI Service

### Settings → Deploy → Custom Start Command

```bash
./start.sh
```

### Configuration Summary

**Settings → General:**
- Root Directory: `crewai-service`

**Settings → Build:**
- Builder: `NIXPACKS`
- Nixpacks Config File: `../nixpacks-crewai.toml`

**Settings → Deploy:**
- Custom Start Command: `./start.sh`

**Settings → Variables:**
- `OPENAI_API_KEY`: your-openai-key-here

## Why Custom Start Command Works

1. **Direct Execution**: Railway runs your exact command in a bash shell
2. **Environment Variables Available**: PORT is already set by Railway
3. **Bypasses Nixpacks Issues**: Doesn't rely on TOML parsing/interpolation
4. **Simple**: Just tell Railway exactly what to run

## Testing

After setting Custom Start Command, redeploy and check logs:

**Should see:**
```
=== Pattern Detection API Startup ===
PORT environment variable: 8080
Starting uvicorn...
INFO:     Started server process [1]
INFO:     Uvicorn running on http://0.0.0.0:8080
```

**Should NOT see:**
```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

## Troubleshooting

### If start.sh still fails

Try the Python one-liner:
```bash
python -m uvicorn pattern_detection_api:app --host 0.0.0.0 --port $PORT
```

Python's `-m uvicorn` module approach handles environment variables differently.

### If nothing works

Last resort - hardcode a port and use Railway's port forwarding:
```bash
uvicorn pattern_detection_api:app --host 0.0.0.0 --port 8000
```

Then set `PORT=8000` in Railway environment variables.

## Which Approach to Use?

1. **Try First**: Custom Start Command: `./start.sh`
2. **If that fails**: Custom Start Command: `python -m uvicorn pattern_detection_api:app --host 0.0.0.0 --port $PORT`
3. **Nuclear option**: Remove Custom Start Command, delete nixpacks config, let Railway auto-detect

## Current Status

- ✅ CrewAI Service: Working with start.sh
- ⚠️ Pattern Detection: Try Custom Start Command approach

The issue might be that Railway cached an old deployment. Using Custom Start Command forces it to use your exact command.
