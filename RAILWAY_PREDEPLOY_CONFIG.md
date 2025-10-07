# Railway Pattern Detection - Predeploy Configuration

## Complete Railway Settings

### Settings → General
- **Root Directory**: `python`

### Settings → Deploy
- **Nixpacks Config File**: `../nixpacks-pattern.toml`
- **Custom Build Command**: 
  ```bash
  pip install -r requirements-ml.txt && chmod +x start.sh
  ```
- **Custom Start Command**: 
  ```bash
  ./start.sh
  ```
- **Predeploy Command** (optional, for extra verification):
  ```bash
  python -c "import pattern_detection_api; print('Pattern Detection API imported successfully')"
  ```

## How It Works

### Build Phase Flow:
1. **Nixpacks Install Phase** (from nixpacks-pattern.toml):
   - Installs Python 3.12
   - Upgrades pip, setuptools, wheel

2. **Custom Build Command** (runs after install):
   - Installs dependencies: `pip install -r requirements-ml.txt`
   - Makes start script executable: `chmod +x start.sh`

3. **Predeploy Command** (optional, runs before start):
   - Validates the API module can be imported
   - Catches import errors before deployment goes live

4. **Custom Start Command**:
   - Runs `./start.sh` which handles PORT variable and starts uvicorn

## Why This Works

- **Root Directory = python**: Prevents __pycache__ detection error
- **Nixpacks handles Python**: No need to manually install pip
- **Custom Build runs AFTER pip is installed**: Dependencies install correctly
- **Predeploy validates deployment**: Catches errors early
- **Custom Start uses bash script**: Proper PORT variable expansion

## Verification Steps

After deployment, check Railway logs for:

1. ✅ Nixpacks install phase:
   ```
   Successfully installed pip setuptools wheel
   ```

2. ✅ Custom Build Command:
   ```
   Successfully installed numpy pandas yfinance...
   chmod: changing permissions of 'start.sh': done
   ```

3. ✅ Predeploy Command (if used):
   ```
   Pattern Detection API imported successfully
   ```

4. ✅ Start Phase:
   ```
   === Pattern Detection API Startup ===
   PORT environment variable: 8080
   Starting Pattern Detection API on port 8080
   Uvicorn running on http://0.0.0.0:8080
   ```

## Alternative: Without Predeploy Command

If you don't need the validation step, you can skip the Predeploy Command and just use:

1. Root Directory: `python`
2. Nixpacks Config File: `../nixpacks-pattern.toml`
3. Custom Build Command: `pip install -r requirements-ml.txt && chmod +x start.sh`
4. Custom Start Command: `./start.sh`

This is the minimal configuration that should work reliably.

## Troubleshooting

### If you see "pip: command not found"
- Make sure Custom Build Command runs AFTER Nixpacks install phase
- Verify nixpacks-pattern.toml has `[phases.install]` with pip upgrade
- Check that Root Directory is set to `python`

### If you see "__pycache__" error
- Verify Root Directory is set to `python` (not blank)
- This is the most critical setting

### If you see "Invalid value for '--port': '$PORT'"
- Make sure Custom Start Command is `./start.sh` (not inline uvicorn command)
- Verify start.sh has `export PORT="${PORT:-8000}"`
- Check that start.sh has execute permissions (chmod +x in build command)

## Notes

- **Predeploy vs Postdeploy**: Use predeploy for validation BEFORE going live, postdeploy for tasks AFTER deployment
- **PORT Variable**: Railway injects this at runtime, must use bash script for proper expansion
- **Python 3.12**: Nixpacks handles this with python312 package in nixpacks config
