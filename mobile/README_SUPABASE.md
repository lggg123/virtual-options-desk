# Flutter Mobile App Setup

## Prerequisites

- Flutter SDK (3.0+)
- Dart SDK
- Android Studio / Xcode (for mobile deployment)
- Supabase account

## Installation

1. **Install dependencies**:
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

3. **Run the app**:
   ```bash
   # For web
   flutter run -d chrome

   # For Android
   flutter run -d android

   # For iOS
   flutter run -d ios
   ```

## Features

- **Real-time Candlestick Charts**: View live stock price data with interactive charts
- **AI Stock Picks**: Browse 1000 AI-selected stocks from the monthly screening
- **Pattern Detection**: See candlestick patterns overlaid on charts
- **Search & Filter**: Find stocks by symbol or company name, filter by category
- **Stock Details**: View comprehensive analysis including AI scores, risk metrics, and factor breakdowns

## Architecture

The app uses:
- **Riverpod**: State management
- **Supabase Flutter**: Real-time database and API client
- **FL Chart**: Candlestick chart visualization
- **Dio**: HTTP client for API calls

## File Structure

```
lib/
├── main.dart                          # App entry point
├── config/
│   ├── theme.dart                     # App theme
│   ├── app_config.dart                # API configuration
│   └── supabase_config.dart           # Supabase initialization
├── models/
│   ├── candle.dart                    # Candlestick data model
│   ├── ai_insight.dart                # AI insight model
│   ├── stock_pick.dart                # Stock pick model
│   └── candlestick_pattern.dart       # Pattern detection model
├── services/
│   ├── market_data_service.dart       # Market data API
│   ├── ai_service.dart                # AI insights API
│   └── supabase_service.dart          # Supabase operations
├── providers/
│   ├── market_data_provider.dart      # Market data state
│   ├── ai_provider.dart               # AI insights state
│   ├── stock_picks_provider.dart      # Stock picks state
│   └── patterns_provider.dart         # Patterns state
├── screens/
│   ├── home_screen.dart               # Main screen with tabs
│   ├── stock_picks_screen.dart        # AI picks browser
│   └── stock_detail_screen.dart       # Detailed stock view
└── widgets/
    ├── candlestick_chart_widget.dart  # Chart display
    ├── stock_search_bar.dart          # Search input
    └── ai_insights_panel.dart         # AI insights display
```

## Connecting to Supabase

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Run the schema from `/database/supabase_schema.sql`

2. **Get Credentials**:
   - Dashboard → Settings → API
   - Copy URL and anon key
   - Add to `.env` file

3. **Test Connection**:
   ```bash
   flutter run
   # Navigate to "AI Picks" tab
   # You should see stock picks from your database
   ```

## Real-time Features

The app supports real-time subscriptions for:
- New stock picks (when ML runs monthly screening)
- New candlestick patterns (as they're detected)

## Troubleshooting

**"No stock picks available"**:
- Ensure Supabase is configured correctly
- Run monthly screening job to populate data
- Check database has data: `select count(*) from stock_picks;`

**Charts not loading**:
- Verify API_BASE_URL in .env
- Check Next.js server is running on port 3000
- Ensure market data service is working

**Build errors**:
```bash
flutter clean
flutter pub get
flutter run
```

## Deployment

### Web
```bash
flutter build web
# Deploy to Vercel, Netlify, or any static host
```

### Android
```bash
flutter build apk --release
# Find APK in build/app/outputs/flutter-apk/
```

### iOS
```bash
flutter build ios --release
# Open in Xcode and deploy to App Store
```

## Next Steps

1. Run the monthly ML screening to populate database
2. Configure real-time data feed for live charts
3. Customize theme and branding
4. Add push notifications for new picks
5. Implement user authentication (optional)
