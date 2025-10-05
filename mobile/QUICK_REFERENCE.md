# Quick Reference - Flutter Mobile App

## 🎯 Quick Commands

```bash
# Setup
cd mobile
flutter pub get

# Run app
flutter run

# List devices
flutter devices

# Hot reload while running
r     # Hot reload
R     # Hot restart
q     # Quit

# Build for production
flutter build apk --release        # Android
flutter build ios --release        # iOS

# Clean build
flutter clean
flutter pub get
```

## 📁 Project Structure at a Glance

```
mobile/lib/
├── main.dart                          # App entry point ⭐
├── config/
│   ├── app_config.dart               # API URLs & settings ⚙️
│   └── theme.dart                    # App styling
├── models/
│   ├── candle.dart                   # Candlestick data
│   └── ai_insight.dart               # AI predictions
├── providers/
│   ├── market_data_provider.dart     # Market data state
│   └── ai_provider.dart              # AI insights state
├── screens/
│   └── home_screen.dart              # Main screen 🏠
├── services/
│   ├── market_data_service.dart      # API calls for market data
│   └── ai_service.dart               # API calls for AI
└── widgets/
    ├── candlestick_chart_widget.dart # Chart display 📊
    ├── stock_search_bar.dart         # Search UI
    └── ai_insights_panel.dart        # AI predictions panel
```

## 🔧 Where to Add Your Code

| What you have | Where to put it |
|---------------|-----------------|
| Custom chart widget | `lib/widgets/your_widget.dart` |
| New screen | `lib/screens/your_screen.dart` |
| Data model | `lib/models/your_model.dart` |
| API service | `lib/services/your_service.dart` |
| State provider | `lib/providers/your_provider.dart` |
| Helper functions | `lib/utils/your_utils.dart` |

## ⚙️ Key Files to Configure

1. **API URLs** → `lib/config/app_config.dart`
   ```dart
   static const String apiBaseUrl = 'http://YOUR_IP:3000';
   ```

2. **App Name** → `pubspec.yaml`
   ```yaml
   name: virtual_options_desk_mobile
   ```

3. **Android Package** → `android/app/build.gradle`
   ```gradle
   applicationId "com.virtualoptionsdesk.mobile"
   ```

## 🔗 Integration with Backend

Expected backend endpoints:
- `GET /api/market-data/:symbol/candles?timeframe=1D`
- `GET /api/market-data/:symbol/quote`
- `GET /api/blog/generate-insights?symbol=AAPL`

## 🎨 Key Dependencies

```yaml
candlesticks: ^2.1.0      # Candlestick charts
fl_chart: ^0.66.0          # Additional charts
riverpod: ^2.4.9           # State management
dio: ^5.4.0                # HTTP client
web_socket_channel: ^2.4.0 # Real-time data
```

## 📱 Device-Specific API URLs

| Device Type | API URL |
|-------------|---------|
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://localhost:3000` |
| Physical Device | `http://YOUR_COMPUTER_IP:3000` |

Find your IP:
```bash
# macOS/Linux
ifconfig | grep "inet "
# Windows
ipconfig
```

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Package not found" | `flutter pub get` |
| Gradle errors | `cd android && ./gradlew clean` |
| Pod errors (iOS) | `cd ios && pod install` |
| Flutter lock | `killall -9 dart` |
| Stale cache | `flutter clean && flutter pub get` |

## 📚 Useful Links

- [Flutter Docs](https://flutter.dev/docs) - Official documentation
- [Riverpod](https://riverpod.dev/) - State management
- [Material 3](https://m3.material.io/) - Design system
- [Candlesticks Package](https://pub.dev/packages/candlesticks) - Chart library

## 💡 Pro Tips

1. **Use Hot Reload** - Press `r` while app is running for instant updates
2. **Check Flutter Doctor** - Run `flutter doctor` to verify setup
3. **Use DevTools** - `flutter run` then press `v` for DevTools
4. **Test on Real Device** - More accurate performance testing
5. **Enable Developer Mode** - On Android: tap build number 7 times

---

For detailed instructions, see:
- `mobile/README.md` - Full setup guide
- `mobile/GETTING_STARTED.md` - Integration guide
