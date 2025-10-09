# 🚀 Google Colab Training Guide

Complete instructions for training your AI stock picking models on Google Colab.

---

## 📋 Overview

You have **TWO notebooks** to run:

| Notebook | Tier | Runtime | Output |
|----------|------|---------|--------|
| `train_models_colab.ipynb` | **Pro Tier** ($29.99) | 10-30 min | Ensemble models (XGBoost, RF, LightGBM) |
| `train_lstm_premium.ipynb` | **Premium Tier** ($99.99) | 30-60 min | LSTM deep learning model |

**Important:** Run them in separate Colab sessions. You can run them back-to-back or on different days.

---

## 🎯 Part 1: Train Pro Tier Models

### Step 1: Open in Google Colab

**Option A: Direct Link**
```
https://colab.research.google.com/github/lggg123/virtual-options-desk/blob/main/ml_models/train_models_colab.ipynb
```

**Option B: Manual Upload**
1. Go to https://colab.research.google.com/
2. Click **"File" → "Upload notebook"**
3. Upload `train_models_colab.ipynb` from your computer

**Option C: From GitHub**
1. Go to https://colab.research.google.com/
2. Click **"File" → "Open notebook"**
3. Click the **"GitHub"** tab
4. Enter: `lggg123/virtual-options-desk`
5. Select: `ml_models/train_models_colab.ipynb`

### Step 2: Runtime Setup (Optional but Recommended)

For faster training, use a better runtime:

1. Click **"Runtime" → "Change runtime type"**
2. **Hardware accelerator:** Select **"GPU"** (optional, but faster)
3. Click **"Save"**

> 💡 **Tip:** Even without GPU, the ensemble models train fine. GPU helps but isn't required for Part 1.

### Step 3: Run All Cells

**Easy Way (Recommended):**
1. Click **"Runtime" → "Run all"**
2. Wait 10-30 minutes ☕
3. Monitor progress in the output

**Manual Way:**
1. Click the first cell
2. Press **Shift + Enter** to run each cell
3. Continue through all cells

### Step 4: Handle Warnings

You may see this warning:
> ⚠️ **"Warning: This notebook was not authored by Google"**

- Click **"Run anyway"** - your notebook is safe!

### Step 5: Monitor Training

Watch for these key outputs:
```
✅ Libraries imported successfully
✅ Successfully loaded 50 stocks
✅ Features calculated for 50 stocks
✅ Training data created: 50,000+ samples

Training XGBoost...
Training Random Forest...
Training LightGBM...

✅ ALL MODELS SAVED SUCCESSFULLY
```

### Step 6: Download Trained Models

After training completes, you'll see:
```
📁 trained_models/
  ├── xgboost.pkl
  ├── random_forest.pkl
  ├── lightgbm.pkl
  ├── feature_engineer.pkl
  └── metadata.json
```

**Download Options:**

**A. Download ZIP (Easiest):**
- The last cell creates `trained_models.zip`
- A download link will appear automatically
- Click it to download all files at once

**B. Download Individual Files:**
1. Click the **folder icon** 📁 in the left sidebar
2. Navigate to `trained_models/`
3. Right-click each file → **"Download"**

### Step 7: Save Your Models

**Option 1: Upload to Railway**
1. Go to your Railway project
2. Navigate to your Python service
3. Upload files to `ml_models/` directory

**Option 2: Commit to GitHub**
```bash
# Only if files are < 100MB
git add ml_models/*.pkl ml_models/metadata.json
git commit -m "Add trained Pro tier models"
git push
```

**Option 3: Google Drive**
- Upload to Google Drive
- Share link with yourself
- Download to server when needed

---

## 🚀 Part 2: Train Premium Tier LSTM Model

### Step 1: Open in Google Colab

**Option A: Direct Link**
```
https://colab.research.google.com/github/lggg123/virtual-options-desk/blob/main/ml_models/train_lstm_premium.ipynb
```

**Option B: Manual Upload**
1. Go to https://colab.research.google.com/
2. Click **"File" → "Upload notebook"**
3. Upload `train_lstm_premium.ipynb` from your computer

### Step 2: Enable GPU (REQUIRED!)

⚠️ **Important:** LSTM requires GPU for reasonable training time!

1. Click **"Runtime" → "Change runtime type"**
2. **Hardware accelerator:** Select **"GPU"** (T4 or better)
3. Click **"Save"**

Verify GPU is enabled:
```python
# First cell will show:
✅ Using device: cuda
   GPU: Tesla T4
```

If you see `Using device: cpu`, go back and enable GPU!

### Step 3: Run All Cells

1. Click **"Runtime" → "Run all"**
2. Wait 30-60 minutes ☕ (with GPU)
3. **Without GPU:** 3-4 hours 😴 (not recommended!)

### Step 4: Monitor Training

Watch for these outputs:
```
✅ Using device: cuda
✅ Successfully loaded 30 stocks
✅ Dataset created: 20,000+ sequences

✅ Model initialized:
Total parameters: 150,000+

🚀 Starting training...

Epoch [5/50] - Train Loss: 0.003456, Test Loss: 0.003892
Epoch [10/50] - Train Loss: 0.002341, Test Loss: 0.003012
...
Epoch [50/50] - Train Loss: 0.001234, Test Loss: 0.002456

✅ Training complete!

📊 LSTM MODEL PERFORMANCE
Mean Squared Error: 0.002456
R² Score: 0.1234
```

### Step 5: Download LSTM Models

After training completes:
```
📁 trained_models_premium/
  ├── lstm.pth
  ├── lstm_scaler.pkl
  └── lstm_metadata.json
```

**Download:**
1. The last cell creates `trained_models_premium.zip`
2. Download automatically appears
3. Or use folder browser to download manually

### Step 6: Save Premium Models

Upload to your server under `ml_models/premium/` directory.

---

## 🎯 Summary: What You'll Have

After running both notebooks:

```
ml_models/
├── xgboost.pkl              # Pro tier
├── random_forest.pkl        # Pro tier
├── lightgbm.pkl             # Pro tier
├── feature_engineer.pkl     # Pro tier
├── metadata.json            # Pro tier
└── premium/
    ├── lstm.pth             # Premium tier
    ├── lstm_scaler.pkl      # Premium tier
    └── lstm_metadata.json   # Premium tier
```

---

## 💡 Tips & Tricks

### Save Your Work
Colab notebooks timeout after 12 hours of inactivity. To save your trained models:
1. Always download immediately after training
2. Consider mounting Google Drive to auto-save

### Mount Google Drive (Optional)
Add this cell at the beginning of any notebook:
```python
from google.colab import drive
drive.mount('/content/drive')
# Models will save to: /content/drive/MyDrive/trained_models/
```

### Check Free GPU Quota
- Colab Free: ~15-20 hours/week of GPU
- If you hit limits, wait 12-24 hours or upgrade to Colab Pro

### Rerun Training
If training fails or you want to improve:
1. Just click "Runtime → Restart and run all"
2. Models will be retrained from scratch

---

## 🐛 Troubleshooting

### "No GPU Available"
- **Solution:** Runtime → Change runtime type → GPU → Save
- If GPU is unavailable, try again in a few hours

### "Out of Memory"
- **Solution 1:** Restart runtime, reduce batch size in config
- **Solution 2:** Reduce number of stocks in CONFIG['universe']

### "Insufficient Data" Errors
- **Normal:** Some stocks don't have enough history
- **Solution:** They're skipped automatically, no action needed

### Training Takes Too Long
- **Pro tier without GPU:** 30-45 min (acceptable)
- **Premium tier without GPU:** 3-4 hours (use GPU!)
- **Solution:** Make sure GPU is enabled for LSTM training

### Download Not Working
- **Solution:** Right-click file in folder browser → Download
- Or copy files to Google Drive first

---

## 📊 Expected Results

### Pro Tier Models (Ensemble)
- **R² Score:** 0.05 - 0.15 (normal for stock prediction!)
- **MAE:** 3-8% error
- **Training time:** 10-30 minutes
- **File size:** 50-200 MB total

### Premium Tier LSTM
- **R² Score:** 0.10 - 0.20 (better than ensemble!)
- **MAE:** 2-6% error
- **Training time:** 30-60 minutes with GPU
- **File size:** 10-50 MB

> 💡 **Note:** Even R² of 0.10 is valuable for stock ranking! Perfect prediction is impossible.

---

## 🔄 Retraining Schedule

**Initial:** Train once to get started (do this now!)

**Regular Updates:**
- Pro tier: Retrain monthly
- Premium tier: Retrain every 2-3 months (LSTM is more stable)

**After Major Events:**
- Market crashes, Fed announcements, regime changes
- Retrain within 1-2 weeks

---

## ✅ Next Steps

1. **Run Pro tier notebook first** → Deploy immediately
2. **Run Premium tier notebook** → Deploy within a week
3. **Test predictions** with real users
4. **Monitor performance** and retrain as needed

---

## 🆘 Need Help?

Common issues:
- ✅ GPU not available? Wait a few hours or use Colab Pro
- ✅ Training too slow? Enable GPU for LSTM
- ✅ Models not downloading? Use folder browser or Google Drive
- ✅ Want to customize? Edit CONFIG in Step 3 of each notebook

---

## 🎉 You're Ready!

Open the first notebook and click "Run all". In 10-30 minutes, you'll have working AI models for your Pro tier!

Direct links:
- **Pro tier:** https://colab.research.google.com/github/lggg123/virtual-options-desk/blob/main/ml_models/train_models_colab.ipynb
- **Premium tier:** https://colab.research.google.com/github/lggg123/virtual-options-desk/blob/main/ml_models/train_lstm_premium.ipynb

Good luck! 🚀
