# Railway Pattern Detection - Simplified Configuration

## Complete Railway Settings (Recommended)

### Settings → General
- **Root Directory**: `python`

### Settings → Deploy
- **Nixpacks Config File**: `../nixpacks-pattern.toml` (minimal config)

### Option 1: Virtual Environment (Cleanest Approach)
- **Custom Build Command**: 
  ```bash
  apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && python3 -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip setuptools wheel && /opt/venv/bin/pip install -r requirements-ml.txt && chmod +x start.sh
  ```

- **Custom Start Command**: 
  ```bash
  ./start.sh
  ```

### Option 2: Break System Packages (Simpler, works on Railway)
- **Custom Build Command**: 
  ```bash
  apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && python3 -m pip install --break-system-packages --upgrade pip setuptools wheel && python3 -m pip install --break-system-packages -r requirements-ml.txt && chmod +x start.sh
  ```

- **Custom Start Command**: 
  ```bash
  ./start.sh
  ```

### Option 3: Install Python + Break System Packages (if Python missing)
- **Custom Build Command**: 
  ```bash
  apt-get update && apt-get install -y python3 python3-pip python3-venv libgl1-mesa-glx libglib2.0-0 && python3 -m pip install --break-system-packages -r requirements-ml.txt && chmod +x start.sh
  ```

- **Custom Start Command**: 
  ```bash
  ./start.sh
  ```

**Note**: 
- Skips upgrading pip/setuptools/wheel since they're Debian-managed and cause uninstall errors
- Installs `libgl1-mesa-glx` and `libglib2.0-0` for OpenCV support (fixes libGL.so.1 error)

### If Predeploy doesn't work - Use Custom Build Command instead:

Railway's Python is externally managed (PEP 668), so we need to use `--break-system-packages`:

- **Custom Build Command**:
  ```bash
  python3 -m pip install --break-system-packages --upgrade pip setuptools wheel && python3 -m pip install --break-system-packages -r requirements-ml.txt && chmod +x start.sh
  ```

Or create a virtual environment (cleaner approach):
  ```bash
  python3 -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip setuptools wheel && /opt/venv/bin/pip install -r requirements-ml.txt && chmod +x start.sh
  ```

**Note**: If using venv approach, you'll need to update start.sh to use `/opt/venv/bin/python3` and `/opt/venv/bin/uvicorn`

## How It Works

### Build Phase Flow:
1. **Nixpacks Build Phase** (minimal):
   - Railway builds the container with minimal Nixpacks config
   - Copies files to container

2. **Predeploy Command** (ALL installation happens here):
   - Uses system Python 3 (`python3`)
   - Upgrades pip, setuptools, wheel: `python3 -m pip install --upgrade pip setuptools wheel`
   - Installs all dependencies: `python3 -m pip install -r requirements-ml.txt`
   - Makes start script executable: `chmod +x start.sh`
   - This runs AFTER build, so timing is guaranteed

3. **Custom Start Command**:
   - Runs `./start.sh` which handles PORT variable and starts uvicorn

## Why This Works

- **Root Directory = python**: Prevents __pycache__ detection error
- **Bypass Nixpacks entirely**: Don't rely on Nixpacks Python setup
- **Use system Python**: Railway containers have `python3` available by default
- **Predeploy timing is reliable**: Runs after build completes, before web process starts
- **python3 -m pip**: More reliable than calling `pip` directly
- **Custom Start uses bash script**: Proper PORT variable expansion

## Verification Steps

After deployment, check Railway logs for:

1. ✅ **Build Phase**:
   ```
   Building with Nixpacks
   Copying files to container...
   ```

2. ✅ **Predeploy Command Output**:
   ```
   Collecting pip
   Successfully installed pip-24.0 setuptools-69.0.0 wheel-0.42.0
   
   Collecting numpy
   Collecting pandas
   Collecting yfinance
   Collecting uvicorn
   Collecting fastapi
   ...
   Successfully installed numpy-1.26.4 pandas-2.2.0 yfinance-0.2.37 uvicorn-0.27.0 fastapi-0.109.0 ...
   
   chmod: changing permissions of 'start.sh': done
   ```

3. ✅ **Start Phase**:
   ```
   === Pattern Detection API Startup ===
   PORT environment variable: 8080
   Starting Pattern Detection API on port 8080
   Uvicorn running on http://0.0.0.0:8080
   ```

## Key Differences from Nixpacks Approach

**Old approach (didn't work):**
- Relied on Nixpacks to install Python 3.12
- Used complex [phases.install] and [phases.build] sections
- Timing issues with when pip was available

**New approach (recommended):**
- Use Railway's system Python (`python3`)
- All installation in Predeploy Command
- Predeploy runs at a guaranteed time (after build, before web start)
- More reliable and predictable

## Troubleshooting

### If you see "pip: command not found" in Custom Build
- **Solution 1**: Move the command to Predeploy Command instead
- **Solution 2**: Verify nixpacks-pattern.toml has correct Python 3.12 setup
- **Solution 3**: Check Railway logs to see exact timing of when pip becomes available

### If you see "__pycache__" error
- Verify Root Directory is set to `python` (not blank)
- This is the most critical setting - prevents Railway from scanning entire repo

### If you see "Invalid value for '--port': '$PORT'"
- Make sure Custom Start Command is `./start.sh` (not inline uvicorn command)
- Verify start.sh has `export PORT="${PORT:-8000}"`
- Check that start.sh has execute permissions (chmod +x)

### If dependencies install but imports fail
- Use Predeploy Command to validate: `python -c "import pattern_detection_api; print('Success')"`
- Check for missing system dependencies in nixpacks-pattern.toml
- Verify requirements-ml.txt has all needed packages with compatible versions

### If you see "libGL.so.1: cannot open shared object file"
- **Cause**: OpenCV requires OpenGL libraries that aren't installed by default
- **Solution**: Add `libgl1-mesa-glx` and `libglib2.0-0` to apt-get install command
- **Updated Command**: `apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && ...`
- This error occurs when using opencv-python (cv2) in headless Docker containers

## Notes

- **Custom Build vs Predeploy**: Custom Build runs during build phase, Predeploy runs after build completes
- **Predeploy is safer**: Guaranteed that all build steps are complete before it runs
- **PORT Variable**: Railway injects this at runtime, must use bash script for proper expansion
- **Python 3.12**: Nixpacks config sets up environment, Railway commands handle installation
