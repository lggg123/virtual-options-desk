# 🚀 Quick Deploy to Render

## TL;DR - Deploy in 5 Minutes

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Deploy on Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect repo: `lggg123/virtual-options-desk`
4. Click **"Apply"**
5. Wait 5-10 minutes ☕

### 3. Get Your URLs
After deployment, copy these URLs:
```
Pattern API: https://pattern-detection-api-[random].onrender.com
ML API: https://ml-stock-screening-api-[random].onrender.com
```

### 4. Update iOS App
```swift
let patternAPI = "https://pattern-detection-api-[random].onrender.com"
let mlAPI = "https://ml-stock-screening-api-[random].onrender.com"
```

### 5. Test
```bash
curl https://pattern-detection-api-[random].onrender.com/health
curl https://ml-stock-screening-api-[random].onrender.com/health
```

## ✅ Done!

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for full guide.

---

## 📋 What's Deployed

- ✅ Pattern Detection API (Free tier)
- ✅ ML Stock Screening API (Free tier)
- ✅ Auto-deploy on git push
- ✅ Free HTTPS/SSL
- ✅ 750 hours/month each

## ⚠️ Note on Cold Starts

Free tier services "sleep" after 15 min inactivity. First request after sleep takes ~30-60 seconds. This is normal for free tier!

## 💰 Cost: $0/month

Upgrade to $7/month per service if you need:
- No cold starts
- More RAM
- Faster builds
