# Virtual Options Desk - Mobile App

A Flutter mobile application for viewing stock candlestick charts with AI-powered insights.

## Features

- 📊 **Interactive Candlestick Charts** - Real-time stock price visualization
- 🤖 **AI Insights** - Get AI-generated market analysis and trading insights
- 📱 **Cross-Platform** - Runs on both iOS and Android
- 🔄 **Real-time Data** - Live market data integration with the backend
- 🎨 **Modern UI** - Material Design 3 with light/dark theme support

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Flutter SDK** (3.0.0 or higher)
   - Download from: https://flutter.dev/docs/get-started/install
   - Follow the installation guide for your operating system

2. **Android Studio** (for Android development)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and emulator

3. **Xcode** (for iOS development - macOS only)
   - Download from Mac App Store
   - Install iOS Simulator

4. **VS Code** or **Android Studio** with Flutter/Dart plugins

## Getting Started

### 1. Verify Flutter Installation

```bash
flutter doctor
```

This command checks your environment and displays a report. Ensure all checkmarks are green.

### 2. Install Dependencies

Navigate to the mobile directory and install dependencies:

```bash
cd mobile
flutter pub get
```

### 3. Configure Backend URL

Edit `lib/config/app_config.dart` and update the API URLs to point to your backend:

```dart
static const String apiBaseUrl = 'http://YOUR_BACKEND_URL:3000';
static const String wsBaseUrl = 'ws://YOUR_BACKEND_URL:3000';
```

For local development:
- **Android Emulator**: Use `http://10.0.2.2:3000`
- **iOS Simulator**: Use `http://localhost:3000`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)

### 4. Run the App

#### On an Emulator/Simulator:

```bash
# List available devices
flutter devices

# Run on a specific device
flutter run -d <device-id>

# Or simply run (will prompt to select device)
flutter run
```

#### On a Physical Device:

1. **Android**:
   - Enable Developer Options and USB Debugging on your device
   - Connect via USB
   - Run `flutter run`

2. **iOS**:
   - Connect your iPhone/iPad
   - Run `flutter run`
   - You may need to configure code signing in Xcode

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── config/                   # App configuration
│   │   ├── app_config.dart       # API endpoints & settings
│   │   └── theme.dart            # App theming
│   ├── models/                   # Data models
│   │   ├── candle.dart           # Candlestick data model
│   │   └── ai_insight.dart       # AI insight model
│   ├── providers/                # State management (Riverpod)
│   │   ├── market_data_provider.dart
│   │   └── ai_provider.dart
│   ├── screens/                  # App screens
│   │   └── home_screen.dart      # Main screen
│   ├── services/                 # API services
│   │   ├── market_data_service.dart
│   │   └── ai_service.dart
│   └── widgets/                  # Reusable widgets
│       ├── candlestick_chart_widget.dart
│       ├── stock_search_bar.dart
│       └── ai_insights_panel.dart
├── android/                      # Android-specific files
├── ios/                          # iOS-specific files
└── pubspec.yaml                  # Dependencies & assets
```

## Key Dependencies

- **candlesticks**: Candlestick chart visualization
- **fl_chart**: Additional charting capabilities
- **riverpod**: State management
- **dio**: HTTP client for API calls
- **web_socket_channel**: Real-time WebSocket communication

## Development Tips

### Hot Reload

While the app is running, press:
- `r` - Hot reload (updates UI without restarting)
- `R` - Hot restart (full restart)
- `q` - Quit

### Building for Production

#### Android APK:
```bash
flutter build apk --release
```

#### iOS:
```bash
flutter build ios --release
```

### Running Tests

```bash
flutter test
```

### Code Generation (if using Freezed/json_serializable):

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Troubleshooting

### "Waiting for another flutter command to release the startup lock"
```bash
killall -9 dart
```

### Gradle build errors (Android)
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### Pod install errors (iOS)
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Network connectivity issues
- Ensure your backend is running and accessible
- Check firewall settings
- Verify the API URL in `app_config.dart`

## Integration with Backend

The mobile app expects the following API endpoints:

### Market Data
- `GET /api/market-data/:symbol/candles?timeframe=1D`
- `GET /api/market-data/:symbol/quote`

### AI Insights
- `GET /api/blog/generate-insights?symbol=AAPL`

Ensure your backend (Next.js app in the parent directory) implements these endpoints.

## Adding Your Custom Code

You mentioned you have existing code. Here's where to place different components:

1. **Custom Widgets**: Add to `lib/widgets/`
2. **New Screens**: Add to `lib/screens/`
3. **Data Models**: Add to `lib/models/`
4. **API Services**: Add to `lib/services/`
5. **State Providers**: Add to `lib/providers/`

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev/)
- [Candlesticks Package](https://pub.dev/packages/candlesticks)
- [Material Design 3](https://m3.material.io/)

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is part of the Virtual Options Desk suite.
