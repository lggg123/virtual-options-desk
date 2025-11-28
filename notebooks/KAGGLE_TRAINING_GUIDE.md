# Training ML Models on Kaggle

This guide explains how to train **both** the Ensemble models and LSTM Premium model on Kaggle, which offers **free GPU access** and supports **background execution** for long-running training jobs.

## Which Notebook to Use

| Notebook | File | GPU Needed | Time (5000 stocks) |
|----------|------|------------|-------------------|
| Ensemble Models | `train_ensemble_models.ipynb` | No (CPU fine) | ~2-4 hours |
| LSTM Premium | `train_lstm_premium.ipynb` | Yes (much faster) | ~8-12 hours |

**You can run both in parallel on Kaggle** - each gets its own session.

---

## Why Kaggle?

| Feature | Google Colab (Free) | Kaggle |
|---------|---------------------|--------|
| GPU Hours/Week | ~12 hrs/day (with limits) | 30 hrs/week |
| Background Execution | ❌ No (tab must stay open) | ✅ Yes |
| Session Timeout | 90 min idle, 12 hr max | 12 hr max |
| GPU Type | T4 | T4 or P100 |
| Best For | Quick experiments | Long training jobs |

**Kaggle is ideal for LSTM training** because:
- Training 5000+ stocks takes 8-12 hours
- You can close your browser and let it run
- Get notified when training completes

---

## Step-by-Step Guide

### 1. Create Kaggle Account

1. Go to [kaggle.com](https://www.kaggle.com)
2. Sign up (free account)
3. Verify your phone number (required for GPU access)

### 2. Upload the Notebooks

**For Ensemble Models:**
1. Go to [kaggle.com/code](https://www.kaggle.com/code)
2. Click **"+ New Notebook"**
3. Click **File → Import Notebook**
4. Upload `train_ensemble_models.ipynb`

**For LSTM (in a separate tab/session):**
1. Go to [kaggle.com/code](https://www.kaggle.com/code)
2. Click **"+ New Notebook"**
3. Click **File → Import Notebook**
4. Upload `train_lstm_premium.ipynb`

### 3. Upload Your Stock List (Optional)

1. In the right sidebar, click **"+ Add data"**
2. Click **"Upload"** → **"New Dataset"**
3. Upload your `stocks-list.csv` or `eodhd_us_tickers.csv`
4. Name it something like "stock-list"
5. Click **"Create"**

After uploading, your CSV will be available at:
```
/kaggle/input/stock-list/stocks-list.csv
```

### 4. No Code Changes Needed!

**Both notebooks are already configured for Kaggle.** They automatically:
- Search Kaggle paths for your stock list CSV
- Detect they're running on Kaggle
- Save outputs to `/kaggle/working/` (appears in Output tab)

The notebooks search these paths automatically:
```
/kaggle/input/stock-list/stocks-list.csv
/kaggle/input/stock-list/eodhd_us_tickers.csv
/kaggle/input/stocks-list/stocks-list.csv
/kaggle/input/eodhd-us-tickers/eodhd_us_tickers.csv
/kaggle/working/stocks-list.csv
```

Just make sure your dataset name matches one of these (e.g., name it "stock-list").

### 5. Configure Accelerator

**For Ensemble Models notebook:**
- Leave as **"None"** (CPU) - it doesn't need GPU
- This preserves your GPU quota for LSTM

**For LSTM notebook:**
1. In the right sidebar, find **"Accelerator"**
2. Select **"GPU T4 x2"** or **"GPU P100"**
3. GPU quota resets weekly (30 hours free)

### 6. Run in Background

This is the key advantage of Kaggle:

1. Click **"Run All"** (or Shift+Enter through cells)
2. Once training starts, click **"Save Version"** button (top right)
3. Select:
   - **Version Name**: e.g., "Ensemble Training" or "LSTM Training"
   - **Save & Run All**: ✅ Enabled
   - **Environment**: Leave as default
4. Click **"Save"**

**Now you can close your browser!** The notebook will continue running.

**Running both in parallel:**
- Open each notebook in a separate browser tab
- Click "Save & Run All" on each one
- Both will run simultaneously in separate Kaggle sessions

### 7. Monitor Progress

1. Go to your Kaggle profile → **"Your Work"** → **"Notebooks"**
2. Find your notebook
3. Click on it to see the **"Versions"** tab
4. Click on your running version to see logs

You'll also get an **email notification** when it completes.

### 8. Download Trained Models

Once training completes, go to each notebook's **"Output"** tab:

**From Ensemble notebook:**
- `xgboost.pkl`
- `random_forest.pkl`
- `lightgbm.pkl`
- `feature_engineer.pkl`
- `metadata.json`

**From LSTM notebook:**
- `lstm.pth`
- `lstm_scaler.pkl`
- `lstm_metadata.json`

Click **"Download All"** or download individually.

### 9. Upload to Your Project

Upload all downloaded files to your project's `ml_models/` directory:

```
ml_models/
├── xgboost.pkl          (from Ensemble)
├── random_forest.pkl    (from Ensemble)
├── lightgbm.pkl         (from Ensemble)
├── feature_engineer.pkl (from Ensemble)
├── metadata.json        (from Ensemble)
├── lstm.pth             (from LSTM)
├── lstm_scaler.pkl      (from LSTM)
└── lstm_metadata.json   (from LSTM)
```

---

## Quick Reference: Kaggle vs Colab Paths

| Location | Colab Path | Kaggle Path |
|----------|------------|-------------|
| Uploaded CSV | `/content/stocks-list.csv` | `/kaggle/input/your-dataset/stocks-list.csv` |
| Working directory | `/content/` | `/kaggle/working/` |
| Output files | Same as working | `/kaggle/working/` (shows in Output tab) |

---

## Troubleshooting

### "GPU quota exceeded"
- Wait until next week (resets weekly)
- Or use CPU (much slower, but works)

### "Notebook timed out"
- Kaggle has a 12-hour limit
- Reduce `training_universe_size` in CONFIG
- Or train in batches

### "Can't find CSV file"
- Check the exact path in Kaggle: click on your dataset in the sidebar
- The path format is `/kaggle/input/[dataset-name]/[filename]`

### "Out of memory"
- Reduce `batch_size` in CONFIG (try 32 instead of 64)
- Reduce `hidden_size` (try 64 instead of 128)

---

## Estimated Training Times on Kaggle

| Stock Universe | Ensemble (CPU) | LSTM (GPU) |
|----------------|----------------|------------|
| 500 stocks | 10-30 min | 30-60 min |
| 1000 stocks | 30-60 min | 1-2 hours |
| 2500 stocks | 1-2 hours | 3-5 hours |
| 5000 stocks | 2-4 hours | 8-12 hours |

---

## Monthly Retraining Schedule

Recommended: Retrain **both models** on the **1st of each month**

1. Upload latest `stocks-list.csv` to Kaggle (if updated)
2. Open both notebooks
3. Click "Save & Run All" on each (they run in parallel)
4. Wait for email notifications (Ensemble ~2-4 hrs, LSTM ~8-12 hrs)
5. Download all model files from both notebooks
6. Upload to `ml_models/` directory
7. Redeploy ML API service

---

## Alternative: Kaggle API (Advanced)

For automated monthly retraining, you can use the Kaggle API:

```bash
# Install Kaggle CLI
pip install kaggle

# Configure API key (from kaggle.com/account)
mkdir ~/.kaggle
echo '{"username":"YOUR_USERNAME","key":"YOUR_API_KEY"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json

# Push notebook and run
kaggle kernels push -p /path/to/notebook/folder

# Check status
kaggle kernels status YOUR_USERNAME/notebook-name

# Download output
kaggle kernels output YOUR_USERNAME/notebook-name -p ./output/
```

This can be scheduled with cron or GitHub Actions for fully automated monthly retraining.
