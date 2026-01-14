# ML Service Data Deployment

## Historical Stock Data

The ML service needs `historical_stock_data.csv` to calculate features and make predictions.

### Option 1: Include in Git (Recommended for files < 50MB)

1. Copy the data file:
   ```bash
   cd ml-service
   chmod +x sync-data.sh
   ./sync-data.sh
   ```

2. Commit and deploy:
   ```bash
   git add historical_stock_data.csv
   git commit -m "Add historical stock data for ML service"
   git push
   ```

### Option 2: Railway Volume (For large files)

If the CSV is too large for git:

1. Upload via Railway dashboard:
   - Go to your ML service in Railway
   - Add a volume mounted at `/app/data`
   - Upload `historical_stock_data.csv` to the volume

2. Update the path in `ml_api.py` to look in `/app/data/`

### Option 3: Fetch on Startup

Create an init script that downloads the latest data when the service starts.

## File Size Check

Current data file:
```bash
ls -lh ../data/historical_stock_data.csv
```

If > 50MB, use Option 2 (Railway Volume) instead of committing to git.
