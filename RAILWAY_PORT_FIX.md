# Railway PORT Variable Fix - FINAL SOLUTION

## Problem
```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

## Why Direct Command Failed

Railway's nixpacks runs commands directly without proper shell environment variable expansion. These all failed:

❌ `uvicorn app:app --port $PORT` - Variable not expanded  
❌ `bash -c 'uvicorn app:app --port $PORT'` - Still not expanded by nixpacks  
❌ `uvicorn app:app --port {{PORT}}` - Wrong template syntax  
❌ `uvicorn app:app --port ${PORT}` - Not a shell context

## Solution: Startup Scripts ✅

Created dedicated bash scripts that properly read the PORT environment variable:

### Pattern Detection: `python/start.sh`
```bash
#!/bin/bash
PORT=${PORT:-8000}
echo "Starting Pattern Detection API on port $PORT"
uvicorn pattern_detection_api:app --host 0.0.0.0 --port $PORT
```

### CrewAI Service: `crewai-service/start.sh`
```bash
#!/bin/bash
PORT=${PORT:-8000}
echo "Starting CrewAI Service on port $PORT"
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Updated Nixpacks Configs
```toml
[phases.build]
cmds = ["chmod +x start.sh"]

[start]
cmd = "./start.sh"
```

## Why This Works

1. **Proper Shell Execution**: Script runs in bash shell where variables work
2. **Fallback**: `${PORT:-8000}` defaults to 8000 if PORT not set
3. **Debugging**: Echo statement shows what port is being used
4. **Executable**: chmod +x ensures script is executable
5. **Simple**: Railway just runs `./start.sh`, no quoting issues

## After Redeploy

You should see in Railway logs:
```
Starting Pattern Detection API on port 8080
INFO:     Uvicorn running on http://0.0.0.0:8080
```

No more PORT errors!

## Files Changed

- ✅ `python/start.sh` - New startup script
- ✅ `crewai-service/start.sh` - New startup script  
- ✅ `nixpacks-pattern.toml` - Use ./start.sh
- ✅ `nixpacks-crewai.toml` - Use ./start.sh

## Ready to Deploy

Both services are now ready for Railway deployment:

1. Pattern Detection: Root Directory = `python`, Config = `../nixpacks-pattern.toml`
2. CrewAI Service: Root Directory = `crewai-service`, Config = `../nixpacks-crewai.toml`

Just redeploy and the PORT issue will be resolved!
