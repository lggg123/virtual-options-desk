# 🚀 Complete Setup Guide: Flutter Mobile App + Supabase Integration

## What We Just Built

Your Flutter mobile app now includes:

✅ **Supabase Integration**: Real-time database connection
✅ **Stock Picks Browser**: View 1000 AI-selected stocks
✅ **Advanced Filtering**: By category, confidence, risk score
✅ **Real-time Charts**: Candlestick visualization
✅ **Pattern Detection**: AI-identified chart patterns
✅ **Search**: Find stocks by symbol or company name
✅ **Stock Details**: Comprehensive AI analysis view

## 📁 New Files Created

### Configuration
- `/mobile/lib/config/supabase_config.dart` - Supabase initialization
- `/mobile/.env` - Environment variables (FILL THIS IN!)
- `/mobile/.env.example` - Environment template

### Models
- `/mobile/lib/models/stock_pick.dart` - Stock pick data model
- `/mobile/lib/models/candlestick_pattern.dart` - Pattern detection model

### Services
- `/mobile/lib/services/supabase_service.dart` - Database operations

### Providers (State Management)
- `/mobile/lib/providers/stock_picks_provider.dart` - Stock picks state
- `/mobile/lib/providers/patterns_provider.dart` - Patterns state

### Screens
- `/mobile/lib/screens/stock_picks_screen.dart` - Browse 1000 AI picks
- `/mobile/lib/screens/stock_detail_screen.dart` - Detailed stock analysis

### Updated Files
- `/mobile/pubspec.yaml` - Added supabase_flutter, flutter_dotenv
- `/mobile/lib/main.dart` - Initialize Supabase on startup
- `/mobile/lib/screens/home_screen.dart` - Added bottom navigation

## 🛠️ Setup Instructions

### Step 1: Install Dependencies

```bash
cd /workspaces/virtual-options-desk/mobile
flutter pub get
```

### Step 2: Configure Supabase

1. **Go to your Supabase project** (or create one at supabase.com)

2. **Run the database schema**:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents from `/database/supabase_schema.sql`
   - Click "Run"

3. **Get your credentials**:
   - Dashboard → Settings → API
   - Copy:
     - Project URL
     - Anon (public) key

4. **Update `.env` file**:
   ```bash
   # Edit /mobile/.env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Run the App

```bash
# For web (fastest for testing)
flutter run -d web-server --web-port=8080

# For Chrome
flutter run -d chrome

# For Android (if you have emulator)
flutter run -d android
```

### Step 4: Test the Integration

1. Open the app
2. Click "AI Picks" tab at the bottom
3. You should see stock picks from your database

**If no picks appear**:
- The database is empty (run ML screening to populate)
- Check `.env` credentials are correct
- Verify Supabase RLS policies allow reads

## 📊 How It Works

### Data Flow

```
┌─────────────────────────────────────────┐
│     Flutter Mobile App                  │
│  ┌──────────────────────────────────┐  │
│  │  Stock Picks Screen              │  │
│  │  • Filter by category            │  │
│  │  • Search stocks                 │  │
│  │  • View 1000 picks               │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│  ┌──────────────▼───────────────────┐  │
│  │  Supabase Service                │  │
│  │  • getTopPicks()                 │  │
│  │  • getStockPick()                │  │
│  │  • searchStocks()                │  │
│  └──────────────┬───────────────────┘  │
└─────────────────┼───────────────────────┘
                  │
                  │ REST API / Real-time
                  ↓
┌─────────────────────────────────────────┐
│        Supabase PostgreSQL              │
│  ┌──────────────────────────────────┐  │
│  │  monthly_screens                 │  │
│  │  • screening run metadata        │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  stock_picks                     │  │
│  │  • 1000 AI-selected stocks       │  │
│  │  • ai_score, confidence, risk    │  │
│  │  • model breakdowns              │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  candlestick_patterns            │  │
│  │  • detected patterns             │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Populating Data

To get stock picks in your database:

```bash
# Run Python ML screening service
cd /workspaces/virtual-options-desk
pip install -r python/requirements-ml.txt
pip install -r python/requirements-db.txt

# Run monthly screening
python python/ml_ensemble.py
```

This will:
1. Calculate factors for 5000 stocks
2. Run ML models (XGBoost, RF, LightGBM, LSTM)
3. Select top 1000 stocks
4. Save to Supabase database

## 🎯 Using the App

### Browsing AI Picks

1. **Open "AI Picks" tab**
2. **Filter by category**:
   - All
   - Growth
   - Value
   - Momentum
   - Quality
3. **Each card shows**:
   - Symbol and company name
   - Rank (#1-1000)
   - AI Score (0-100)
   - Confidence (0-100%)
   - Risk Score (0-100)
   - Predicted return

### Viewing Stock Details

1. **Tap any stock card**
2. **See detailed view**:
   - Live candlestick chart
   - Full AI analysis
   - Model breakdown (XGBoost, RF, LightGBM, LSTM)
   - Top factors influencing prediction
   - Recent candlestick patterns

### Searching Stocks

1. **Tap search icon** (top right)
2. **Type symbol or company name**
3. **Results filter in real-time**

## 🔧 Configuration Options

### Adjust Filters

```dart
// In stock_picks_provider.dart

// Change default filters
final minConfidenceProvider = StateProvider<double>((ref) => 0.5); // Only high confidence
final maxRiskProvider = StateProvider<double>((ref) => 50.0); // Only low risk
```

### Change Limit

```dart
// In stock_picks_screen.dart
final picksAsync = ref.watch(topPicksProvider(500)); // Show top 500 instead of 1000
```

### Real-time Updates

To enable real-time updates when new picks are added:

```dart
// In stock_picks_screen.dart
@override
void initState() {
  super.initState();
  
  // Subscribe to new picks
  final service = ref.read(supabaseServiceProvider);
  service.subscribeToStockPicks(
    onData: (picks) {
      // Refresh picks list
      ref.invalidate(topPicksProvider);
    },
    onError: (error) {
      print('Error: $error');
    },
  );
}
```

## 🐛 Troubleshooting

### Error: "Supabase credentials not found"

**Solution**: Create `/mobile/.env` file with your credentials:
```bash
cp /workspaces/virtual-options-desk/mobile/.env.example /workspaces/virtual-options-desk/mobile/.env
# Edit .env and add your Supabase URL and anon key
```

### Error: "No stock picks available"

**Cause**: Database is empty

**Solution**: Run ML screening to populate data:
```bash
cd /workspaces/virtual-options-desk
python python/ml_ensemble.py
```

### Error: "Method 'eq' isn't defined"

**Cause**: Supabase Flutter SDK version mismatch

**Solution**: Update pubspec.yaml:
```yaml
dependencies:
  supabase_flutter: ^2.3.4  # Use latest stable
```

Then run:
```bash
flutter pub upgrade
```

### Charts not loading

**Cause**: Market data service not running

**Solution**:
```bash
# Start Next.js server
cd frontend
bun run dev

# Or start ML service
cd python
uvicorn ml_api:app --reload --port 8002
```

## 📱 Building for Production

### Web
```bash
flutter build web --release
# Deploy to Vercel, Netlify, Firebase Hosting, etc.
```

### Android
```bash
# Generate release APK
flutter build apk --release

# Or generate App Bundle (for Play Store)
flutter build appbundle --release

# Find output in: build/app/outputs/
```

### iOS
```bash
flutter build ios --release
# Open in Xcode: open ios/Runner.xcworkspace
# Archive and upload to App Store
```

## 🚀 Next Steps

1. **Populate Database**: Run ML screening to get 1000 stock picks
2. **Test Filtering**: Try different categories and confidence levels
3. **Add Real-time Data**: Connect live market data feed
4. **Customize UI**: Update theme colors and branding
5. **Add Features**:
   - Watchlist (favorite stocks)
   - Price alerts
   - Push notifications for new picks
   - User authentication
   - Portfolio tracking

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Flutter Docs**: https://flutter.dev/docs
- **Riverpod Docs**: https://riverpod.dev
- **Integration Guide**: `/docs/FLUTTER_INTEGRATION_GUIDE.md`
- **Database Setup**: `/database/SUPABASE_SETUP.md`

## Need Help?

Check existing files for examples:
- See `/mobile/lib/services/supabase_service.dart` for database queries
- See `/mobile/lib/screens/stock_picks_screen.dart` for UI patterns
- See `/database/supabase_schema.sql` for database structure

Happy coding! 🎉
