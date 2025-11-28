# Training LSTM Model on Kaggle

This guide explains how to train the LSTM Premium model on Kaggle, which offers **free GPU access** and supports **background execution** for long-running training jobs.

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

### 2. Upload the Notebook

1. Go to [kaggle.com/code](https://www.kaggle.com/code)
2. Click **"+ New Notebook"**
3. Click **File → Import Notebook**
4. Upload `train_lstm_premium.ipynb` from this repository

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

### 4. Modify the Notebook for Kaggle

Update the CSV path cell to include Kaggle paths. Find the cell that loads stocks and add:

```python
# Load stock list from CSV or download S&P 500
import os

universe = []  # Initialize to prevent NameError

try:
    # Try multiple possible paths (including Kaggle paths)
    for path in ['/kaggle/input/stock-list/stocks-list.csv',      # Kaggle dataset
                 '/kaggle/input/stock-list/eodhd_us_tickers.csv', # Kaggle alternative
                 '/kaggle/working/stocks-list.csv',               # Kaggle working dir
                 '/content/eodhd_us_tickers.csv',                 # Colab
                 '/content/stocks-list.csv',                      # Colab
                 'stocks-list.csv',                               # Current directory
                 '../data/eodhd_us_tickers.csv',
                 'data/eodhd_us_tickers.csv',
                 '../data/stocks-list.csv',
                 'data/stocks-list.csv']:
        if os.path.exists(path):
            stocks_df = pd.read_csv(path)
            # Try different column names
            for col in ['Symbol', 'symbol', 'ticker', 'Ticker', 'SYMBOL', 'Code']:
                if col in stocks_df.columns:
                    if CONFIG['training_universe_size'] is None:
                        universe = stocks_df[col].dropna().tolist()
                    else:
                        universe = stocks_df[col].head(CONFIG['training_universe_size']).tolist()
                    print(f"✅ Loaded {len(universe)} stocks from {path}")
                    break
            if universe:
                break
except Exception as e:
    print(f"⚠️  Error loading CSV: {e}")

# Fallback: Download S&P 500
if not universe:
    print("⚠️  CSV not found, downloading S&P 500 list...")
    sp500_table = pd.read_html('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')[0]
    if CONFIG['training_universe_size'] is None:
        universe = sp500_table['Symbol'].tolist()
    else:
        universe = sp500_table['Symbol'].head(CONFIG['training_universe_size']).tolist()
    print(f"✅ Loaded {len(universe)} stocks from S&P 500")

print(f"Total stocks: {len(universe)}")
```

### 5. Update the Save Path for Kaggle

Find the cell that saves the model and update it:

```python
import os

# Use Kaggle output directory
output_dir = '/kaggle/working'
os.makedirs(output_dir, exist_ok=True)

print(f"💾 Saving model to {output_dir}/...\n")

# Save PyTorch model
torch.save({
    'model_state_dict': model.state_dict(),
    'input_size': input_size,
    'hidden_size': CONFIG['hidden_size'],
    'num_layers': CONFIG['num_layers'],
    'dropout': CONFIG['dropout'],
    'sequence_length': CONFIG['sequence_length'],
}, f"{output_dir}/lstm.pth")
print("✅ Saved lstm.pth")

# Save scaler
joblib.dump(scaler, f"{output_dir}/lstm_scaler.pkl")
print("✅ Saved lstm_scaler.pkl")

# Save metadata
metadata = {
    'training_date': datetime.now().isoformat(),
    'num_stocks': len(universe) - len(failed_tickers),
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'sequence_length': CONFIG['sequence_length'],
    'input_size': input_size,
    'performance': {
        'mse': float(mse),
        'mae': float(mae),
        'r2': float(r2),
        'best_test_loss': float(best_test_loss)
    },
    'config': CONFIG
}

with open(f"{output_dir}/lstm_metadata.json", 'w') as f:
    json.dump(metadata, f, indent=2)
print("✅ Saved lstm_metadata.json")

print("\n🎉 LSTM TRAINING COMPLETE!")
print("Files saved to Output tab on the right →")
```

### 6. Enable GPU

1. In the right sidebar, find **"Accelerator"**
2. Select **"GPU T4 x2"** or **"GPU P100"**
3. GPU quota resets weekly (30 hours free)

### 7. Run in Background

This is the key advantage of Kaggle:

1. Click **"Run All"** (or Shift+Enter through cells)
2. Once training starts, click **"Save Version"** button (top right)
3. Select:
   - **Version Name**: "LSTM Training Run 1" (or similar)
   - **Save & Run All**: ✅ Enabled
   - **Environment**: Leave as default
4. Click **"Save"**

**Now you can close your browser!** The notebook will continue running.

### 8. Monitor Progress

1. Go to your Kaggle profile → **"Your Work"** → **"Notebooks"**
2. Find your notebook
3. Click on it to see the **"Versions"** tab
4. Click on your running version to see logs

You'll also get an **email notification** when it completes.

### 9. Download Trained Models

Once training completes:

1. Go to your notebook's **"Output"** tab
2. You'll see:
   - `lstm.pth`
   - `lstm_scaler.pkl`
   - `lstm_metadata.json`
3. Click **"Download All"** or download individually

### 10. Upload to Your Project

Upload the downloaded files to your project:

```
ml_models/
├── lstm.pth
├── lstm_scaler.pkl
└── lstm_metadata.json
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

## Estimated Training Times on Kaggle GPU

| Stock Universe | Approx. Time |
|----------------|--------------|
| 200 stocks | 30-60 minutes |
| 500 stocks | 1-2 hours |
| 1000 stocks | 2-4 hours |
| 2500 stocks | 5-7 hours |
| 5000 stocks | 8-12 hours |

---

## Monthly Retraining Schedule

Recommended: Retrain LSTM on the **1st of each month**

1. Upload latest `stocks-list.csv` to Kaggle
2. Run notebook with "Save & Run All"
3. Download new models when complete
4. Upload to `ml_models/` directory
5. Redeploy ML API service

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
