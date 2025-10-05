# ✅ Flutter Mobile App - Quick Start Checklist

Follow these steps to get your Flutter mobile app running with Supabase integration.

## Prerequisites
- [ ] Flutter SDK installed (run `flutter doctor` to check)
- [ ] Supabase account created at [supabase.com](https://supabase.com)
- [ ] Main repository cloned

## Step 1: Install Dependencies (5 min)

```bash
cd /workspaces/virtual-options-desk/mobile
flutter pub get
```

**Expected output:**
```
Running "flutter pub get" in mobile...
Resolving dependencies...
+ supabase_flutter 2.3.4
+ flutter_dotenv 5.1.0
...
Got dependencies!
```

- [ ] Dependencies installed successfully

## Step 2: Set Up Supabase Database (10 min)

### 2.1 Create Supabase Project
1. [ ] Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. [ ] Click "New Project"
3. [ ] Name it: `virtual-options-desk`
4. [ ] Choose a database password
5. [ ] Select region (closest to you)
6. [ ] Click "Create new project" (takes 2-3 minutes)

### 2.2 Run Database Schema
1. [ ] Open your project dashboard
2. [ ] Click "SQL Editor" in left sidebar
3. [ ] Click "New query"
4. [ ] Copy entire contents of `/database/supabase_schema.sql`
5. [ ] Paste into SQL Editor
6. [ ] Click "Run" button
7. [ ] Wait for "Success. No rows returned" message

### 2.3 Get API Credentials
1. [ ] Click "Settings" (gear icon) in left sidebar
2. [ ] Click "API" in settings menu
3. [ ] Copy "Project URL" (starts with `https://`)
4. [ ] Copy "anon public" key (long string starting with `eyJ...`)

## Step 3: Configure Environment (2 min)

```bash
cd /workspaces/virtual-options-desk/mobile

# Copy template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Update these values:**
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] `.env` file created with correct credentials

## Step 4: Run the App (2 min)

### Option A: Web (Fastest for testing)
```bash
flutter run -d web-server --web-port=8080
```

### Option B: Chrome Browser
```bash
flutter run -d chrome
```

### Option C: Android Emulator
```bash
flutter run -d android
```

**Expected output:**
```
Launching lib/main.dart on Chrome in debug mode...
✓ Built build/web
```

- [ ] App launched successfully
- [ ] App loads without errors

## Step 5: Test the Integration (5 min)

### 5.1 Test Empty State
1. [ ] Open app in browser/emulator
2. [ ] Click "AI Picks" tab at bottom
3. [ ] See "No stock picks available" message (normal - database is empty)

### 5.2 Verify Supabase Connection
1. [ ] Check terminal for "✅ Supabase initialized successfully"
2. [ ] No errors about missing credentials

## Step 6: Populate Database with Test Data (Optional - 30 min)

If you want to see stock picks in the app, you need to run the ML screening:

```bash
cd /workspaces/virtual-options-desk

# Install Python ML dependencies
pip install -r python/requirements-ml.txt
pip install -r python/requirements-db.txt

# Update .env with Supabase credentials
# Then run screening (this takes 20-30 minutes)
python python/ml_ensemble.py
```

**OR** manually insert test data in Supabase:

1. [ ] Open Supabase Dashboard → Table Editor
2. [ ] Click `monthly_screens` table → "Insert row"
3. [ ] Add: `universe_size: 100, picks_generated: 10, model_version: 1.0.0`
4. [ ] Click `stock_picks` table → "Insert row"
5. [ ] Add test stock (see example below)

**Example test stock:**
```json
{
  "screen_id": "<your-screen-id>",
  "symbol": "AAPL",
  "company_name": "Apple Inc.",
  "sector": "Technology",
  "ai_score": 85.5,
  "rank": 1,
  "confidence": 0.87,
  "risk_score": 35.2,
  "predicted_return": 12.5,
  "category": "growth"
}
```

- [ ] Test data added to database
- [ ] Refresh app to see stock picks

## Step 7: Verify Features Working

### 7.1 AI Picks Screen
- [ ] See list of stock picks
- [ ] Filter by category works (tap filter icon)
- [ ] Search works (tap search icon)
- [ ] Cards show AI score, confidence, risk

### 7.2 Stock Detail Screen
- [ ] Tap any stock card
- [ ] See candlestick chart
- [ ] See detailed metrics
- [ ] See model breakdown (if populated)

### 7.3 Charts Screen
- [ ] Tap "Charts" tab at bottom
- [ ] Search for a stock (e.g., "AAPL")
- [ ] See candlestick chart load
- [ ] See AI insights panel

## 🎉 You're Done!

Your Flutter mobile app is now:
- ✅ Connected to Supabase database
- ✅ Displaying AI stock picks
- ✅ Showing real-time charts
- ✅ Ready for customization

## 📚 Next Steps

1. **Customize UI**: Edit theme in `lib/config/theme.dart`
2. **Add Features**: See `docs/FLUTTER_INTEGRATION_GUIDE.md`
3. **Deploy**: Build for production (see below)
4. **Monitor**: Check Supabase Dashboard for usage

## 🚀 Building for Production

### Web
```bash
flutter build web --release
# Deploy to Vercel: vercel --prod
```

### Android
```bash
flutter build apk --release
# APK location: build/app/outputs/flutter-apk/app-release.apk
```

### iOS
```bash
flutter build ios --release
# Open in Xcode: open ios/Runner.xcworkspace
```

## 🐛 Troubleshooting

### "Supabase credentials not found"
**Fix**: Ensure `.env` file exists with correct URL and key

### "No stock picks available"
**Fix**: Database is empty. Add test data or run ML screening

### Build errors
**Fix**: Clean and rebuild
```bash
flutter clean
flutter pub get
flutter run
```

### Charts not loading
**Fix**: Ensure market data API is configured in main project `.env.local`

## 📞 Need Help?

- Check [SETUP_COMPLETE.md](SETUP_COMPLETE.md) for detailed guide
- See [Supabase Setup](../database/SUPABASE_SETUP.md) for database help
- Review [Flutter Integration](../docs/FLUTTER_INTEGRATION_GUIDE.md) for architecture

---

**Total Setup Time**: ~25 minutes (without ML screening)
**With ML Screening**: ~55 minutes (includes model training)
