# Payment API Railway Troubleshooting

## Current Fixes Applied

### 1. Port Configuration ✅
- Changed default port from `3001` to `8080` (Railway standard)
- Updated Dockerfile EXPOSE and HEALTHCHECK
- Server now reads `PORT` env var correctly

### 2. Health Check Configuration ✅
- Increased start period from 5s to 40s (allows time for dependencies)
- Increased timeout from 3s to 10s
- Health check now uses dynamic PORT env var

### 3. Fastify Configuration ✅
- Added `trustProxy: true` for Railway's proxy
- Enhanced logging for production
- Better error reporting

### 4. Railway Configuration ✅
- Created `railway.json` with proper settings
- Health check timeout: 100 seconds
- Restart policy: ON_FAILURE with 10 retries

## Railway Environment Variables Required

Make sure these are set in Railway Dashboard → Settings → Variables:

```bash
PORT=8080
NODE_ENV=production
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=https://ofsneyxnervkoeommlfh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=http://www.marketstockpick.com
```

## Debugging Steps

### 1. Check Railway Logs
In Railway Dashboard:
- Go to your payment-api service
- Click "Deployments" tab
- Click latest deployment
- View logs for errors

### 2. Common Issues

**"Cannot find module"**
- Solution: Ensure build step completed successfully
- Check: `npm run build` works locally

**"ECONNREFUSED" or "Connection timeout"**
- Solution: Check Supabase URL is correct
- Verify: Service role key is valid
- Test: Supabase connection from Railway

**"Port already in use"**
- Solution: Railway sets PORT automatically
- Verify: No hardcoded port in code

**"Stripe API error"**
- Solution: Check Stripe secret key is correct
- Verify: Key starts with `sk_test_` or `sk_live_`

**"Health check failed"**
- Solution: Increase healthcheck timeout
- Check: `/health` endpoint returns 200
- Verify: Server starts within 40 seconds

### 3. Test Locally with Railway Port

```bash
cd payment-api
PORT=8080 npm run dev
```

Then test health check:
```bash
curl http://localhost:8080/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T...",
  "stripe": "connected",
  "supabase": "connected"
}
```

### 4. Check Dockerfile Build

```bash
cd payment-api
docker build -t payment-api-test .
docker run -p 8080:8080 --env-file .env payment-api-test
```

Then test:
```bash
curl http://localhost:8080/health
```

## Next Steps After Fix

1. **Commit and push changes**
   ```bash
   git add .
   git commit -m "fix: Railway deployment - port and health check configuration"
   git push
   ```

2. **Railway will auto-deploy** (if linked to GitHub)
   - Or manually: `railway up --service payment-api`

3. **Monitor deployment**
   - Watch logs for startup messages
   - Wait for health check to pass (may take 30-40 seconds)

4. **Test deployment**
   ```bash
   curl https://your-railway-domain.up.railway.app/health
   ```

## Expected Startup Logs

```
🚀 Payment API running on http://0.0.0.0:8080
📊 Health check available at http://0.0.0.0:8080/health
🔧 Environment: production
Server listening at http://0.0.0.0:8080
```

## Still Having Issues?

Check these specific things:

1. **Build logs** - Did TypeScript compile successfully?
2. **Runtime logs** - Any errors when starting?
3. **Environment variables** - All required vars set?
4. **Supabase connection** - Can Railway reach your Supabase?
5. **Stripe API** - Is the secret key valid?

If you see specific error messages, share them and I can help debug further!
