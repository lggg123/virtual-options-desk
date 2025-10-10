# ML Model Training Guide

## 🎯 Quick Start with Google Colab

### Step 1: Upload Notebook to Colab

**Option A: From GitHub**
1. Go to [Google Colab](https://colab.research.google.com/)
2. Click `File` → `Open notebook`
3. Select the `GitHub` tab
4. Enter your repo: `lggg123/virtual-options-desk`
5. Select `ml_models/train_models_colab.ipynb`

**Option B: Direct Upload**
1. Go to [Google Colab](https://colab.research.google.com/)
2. Click `File` → `Upload notebook`
3. Upload `ml_models/train_models_colab.ipynb` from your computer

### Step 2: Run the Notebook

1. **Click `Runtime` → `Run all`** to execute all cells
2. **Wait 10-30 minutes** for training to complete
3. Models will be saved in the `trained_models/` folder

### Step 3: Download Trained Models

**Option A: Download Individual Files**
1. Click the **folder icon** (📁) in the left sidebar
2. Navigate to `trained_models/`
3. Right-click each file and select **Download**:
   - `xgboost.pkl`
   - `random_forest.pkl`
   - `lightgbm.pkl`
   - `feature_engineer.pkl`
   - `metadata.json`

**Option B: Download as ZIP** (Recommended)
- The last cell creates `trained_models.zip`
- Download it directly from the Colab interface

### Step 4: Deploy Models

**Option A: Upload to Railway (Recommended)**
1. Go to your Railway project dashboard
2. Open the Python/ML service
3. Navigate to the `ml_models/` directory
4. Upload all 5 model files
5. Set environment variable: `ML_MODELS_ENABLED=true`

**Option B: Commit to GitHub**
```bash
# Only if files are < 100MB each
git add ml_models/*.pkl ml_models/*.json
git commit -m "Add trained ML models"
git push
```

**Option C: Cloud Storage**
- Upload to AWS S3, Google Cloud Storage, or similar
- Update your code to download models on startup

### Step 5: Enable ML in Your App

1. Update `/python/pattern_detection_api.py`:
   ```python
   detector = PatternDetector(use_ml=True)  # Change from False
   ```

2. Commit and push:
   ```bash
   git add python/pattern_detection_api.py
   git commit -m "Enable ML predictions"
   git push
   ```

3. Redeploy your services

---

## 📊 What the Models Do

- **XGBoost**: Gradient boosting, excels at capturing non-linear patterns
- **Random Forest**: Ensemble of decision trees, robust to overfitting
- **LightGBM**: Fast gradient boosting, great for large datasets
- **Ensemble**: Weighted combination of all three models

**Target**: 30-day forward stock returns

**Features**: 20+ technical indicators including:
- Price momentum (1d, 5d, 20d, 60d returns)
- Moving averages (5, 10, 20, 50, 200-day)
- RSI, MACD, Bollinger Bands
- Volume patterns
- Volatility measures

---

## 🔧 Customization

### Change Stock Universe
Edit the `CONFIG['universe']` list in **Step 3** to include different stocks.

### Adjust Training Period
```python
CONFIG = {
    'period': '5y',  # Change from '3y' to '5y' for more data
    'forward_days': 60,  # Change from 30 to predict 60 days ahead
}
```

### Tune Model Hyperparameters
Edit the `xgb_params`, `rf_params`, or `lgb_params` dictionaries in Steps 9-11.

### Adjust Ensemble Weights
```python
WEIGHTS = {
    'xgboost': 0.40,      # Change from 0.35
    'random_forest': 0.30, # Change from 0.25
    'lightgbm': 0.30      # Change from 0.40
}
```

---

## 🐛 Troubleshooting

### "Insufficient data" errors
- Some stocks may not have enough historical data
- Failed stocks are logged and skipped automatically

### Out of Memory
- Reduce the stock universe (fewer symbols)
- Use shorter training period
- Use Colab Pro for more RAM

### Model performance is poor
- Try longer training period (5 years instead of 3)
- Add more stocks to training universe
- Tune hyperparameters
- Consider feature engineering improvements

### Download issues in Colab
- Use the ZIP download option instead of individual files
- Check your Google Drive space if using Drive mount

---

## 📈 Expected Performance

**Typical Results:**
- R² Score: 0.05 - 0.15 (stock prediction is hard!)
- MAE: 0.03 - 0.08 (3-8% error)
- Better than random: Yes, if R² > 0

**Note**: Even small R² scores are valuable in stock prediction. The goal is ranking stocks, not perfect price prediction.

---

## 🔄 Retraining Schedule

**Recommended frequency:**
- **Initial**: Train once to get started
- **Regular**: Retrain monthly with new data
- **After major events**: Retrain after market regime changes

**Automation**: Set up a scheduled job to retrain models automatically using your ML API's `/api/ml/train` endpoint.

---

## 📞 Support

If you encounter issues:
1. Check the Colab notebook output for error messages
2. Verify all required packages are installed
3. Ensure you have sufficient data for all stocks
4. Review the metadata.json file for training statistics

---

## ✅ Next Steps

After deploying models:
1. Test predictions with `/api/ml/predict` endpoint
2. Monitor model performance in production
3. Set up automated retraining pipeline
4. Add more advanced features over time
