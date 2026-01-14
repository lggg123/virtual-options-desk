# ML Service - Railway Environment Variables

Add these to your Railway ML service:

```bash
# Supabase Configuration
SUPABASE_URL=https://accxrelxynwhmiqcwgwf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY3hyZWx4eW53aG1pcWN3Z3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjQzNjEsImV4cCI6MjA4MDE0MDM2MX0.hEPqSO6MRipLkG125veBQMPZCbHHEv1eWgp1nEOjLnY
```

## How to Add (2 options):

### Option 1: Railway Dashboard
1. Go to Railway → Your ML Service → Variables
2. Click "New Variable"
3. Add both SUPABASE_URL and SUPABASE_ANON_KEY
4. Deploy

### Option 2: Railway CLI
```bash
cd ml-service
railway variables set SUPABASE_URL=https://accxrelxynwhmiqcwgwf.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY3hyZWx4eW53aG1pcWN3Z3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjQzNjEsImV4cCI6MjA4MDE0MDM2MX0.hEPqSO6MRipLkG125veBQMPZCbHHEv1eWgp1nEOjLnY
```

## Test After Deployment

Once deployed, test the API:

```bash
curl -X POST https://adventurous-blessing-production.up.railway.app/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL"], "top_n": 10}'
```

Expected response:
```json
{
  "predictions": [...],
  "generated_at": "2026-01-14T...",
  "model_version": "1.0.0"
}
```

## Files to Deploy

Make sure these are committed:
- ✅ ml_api.py (updated to use Supabase)
- ✅ supabase_data.py (new file)
- ✅ requirements.txt (includes supabase, python-dotenv)
- ✅ train_ml_models.py (feature calculations)
- ❌ .env (DO NOT commit - use Railway variables instead)
- ❌ historical_stock_data.csv (no longer needed!)

## Deploy Command

```bash
git add ml-service/ml_api.py ml-service/supabase_data.py ml-service/requirements.txt
git commit -m "feat: integrate Supabase for historical data"
git push
```

Railway will automatically redeploy with Supabase integration!
