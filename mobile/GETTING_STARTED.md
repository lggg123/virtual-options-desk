# Getting Started with Your Flutter Project

Welcome! This guide will help you add your existing Flutter code to this project structure.

## ✅ What's Already Set Up

Your Flutter project now has:

1. **Complete Project Structure** 
   - `mobile/` directory with proper Flutter architecture
   - `pubspec.yaml` with all necessary dependencies
   - Platform-specific configurations (Android & iOS)

2. **Core Components**
   - Main app entry point (`lib/main.dart`)
   - Theme configuration
   - API service layer
   - State management with Riverpod
   - Basic candlestick chart widget

3. **Example Features**
   - Stock search bar
   - Candlestick chart display
   - AI insights panel
   - Market data integration

## 📝 Adding Your Custom Code

### Step 1: Review the Existing Structure

```bash
cd mobile
tree lib/  # See the current structure
```

The structure follows Flutter best practices:
- `lib/main.dart` - App entry point
- `lib/config/` - Configuration files
- `lib/models/` - Data models
- `lib/services/` - API services
- `lib/providers/` - State management
- `lib/screens/` - App screens/pages
- `lib/widgets/` - Reusable UI components

### Step 2: Integrate Your Code

#### If you have custom chart widgets:
```bash
# Copy to widgets directory
cp your-code/chart_widget.dart lib/widgets/
```

Then import in the appropriate screen:
```dart
import 'package:virtual_options_desk_mobile/widgets/chart_widget.dart';
```

#### If you have custom models:
```bash
# Copy to models directory
cp your-code/stock_model.dart lib/models/
```

#### If you have custom screens:
```bash
# Copy to screens directory
cp your-code/trading_screen.dart lib/screens/
```

### Step 3: Update Dependencies

If your code needs additional packages:

1. Open `pubspec.yaml`
2. Add dependencies under `dependencies:` section
3. Run `flutter pub get`

Example:
```yaml
dependencies:
  flutter:
    sdk: flutter
  your_package: ^1.0.0  # Add here
```

### Step 4: Configure API Endpoints

Edit `lib/config/app_config.dart`:

```dart
class AppConfig {
  // Update these URLs to match your backend
  static const String apiBaseUrl = 'http://localhost:3000';
  static const String wsBaseUrl = 'ws://localhost:3000';
  
  // Add custom endpoints
  static const String yourCustomEndpoint = '/api/your-endpoint';
}
```

### Step 5: Update the Home Screen

Edit `lib/screens/home_screen.dart` to include your custom widgets:

```dart
import '../widgets/your_custom_widget.dart';

// In the build method:
Column(
  children: [
    YourCustomWidget(),  // Your widget
    CandlestickChartWidget(symbol: _selectedSymbol),
  ],
)
```

## 🔧 Common Customizations

### Adding a New Screen

1. Create file: `lib/screens/your_screen.dart`
2. Add to navigation in `main.dart` or use named routes

```dart
// Example screen
class YourScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Your Screen')),
      body: Center(child: Text('Your content')),
    );
  }
}
```

### Adding a New Service

1. Create file: `lib/services/your_service.dart`
2. Create a provider in `lib/providers/`

```dart
// Example service
class YourService {
  final Dio _dio = Dio();
  
  Future<YourData> fetchData() async {
    final response = await _dio.get('/your-endpoint');
    return YourData.fromJson(response.data);
  }
}

// Provider
final yourServiceProvider = Provider<YourService>((ref) {
  return YourService();
});
```

### Adding Custom Styling

Edit `lib/config/theme.dart`:

```dart
static ThemeData get lightTheme {
  return ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: Colors.yourColor,  // Customize
    ),
    // Add more customization
  );
}
```

## 🚀 Running Your App

### First Time Setup

```bash
# From the mobile directory
flutter pub get
flutter run
```

### During Development

Hot reload is your friend:
- `r` - Hot reload (fastest, maintains state)
- `R` - Hot restart (full restart)
- `q` - Quit

### Testing on Different Devices

```bash
# List all devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Run on Chrome (for web testing)
flutter run -d chrome
```

## 📚 File Import Examples

### Importing from your package:
```dart
import 'package:virtual_options_desk_mobile/models/candle.dart';
import 'package:virtual_options_desk_mobile/services/market_data_service.dart';
import 'package:virtual_options_desk_mobile/widgets/candlestick_chart_widget.dart';
```

### Importing relative files:
```dart
import '../models/candle.dart';
import '../services/market_data_service.dart';
import '../../config/app_config.dart';
```

## 🐛 Troubleshooting

### "Package not found" errors
```bash
flutter clean
flutter pub get
```

### Build errors
```bash
# Android
cd android && ./gradlew clean && cd ..
flutter clean

# iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
flutter clean
```

### Hot reload not working
- Press `R` for hot restart
- Check for syntax errors
- Some changes require full restart (e.g., adding dependencies)

## 📖 Next Steps

1. **Review Example Code**: Check `lib/widgets/candlestick_chart_widget.dart` to see how the chart is implemented
2. **Add Your Features**: Start integrating your custom code following the patterns above
3. **Test Thoroughly**: Run on both iOS and Android emulators
4. **Connect to Backend**: Update API URLs and test data flow

## 💡 Best Practices

1. **Keep it organized**: Follow the existing folder structure
2. **Use const constructors**: Improves performance
3. **Handle errors**: Always add error handling for API calls
4. **Test responsiveness**: Check on different screen sizes
5. **Use providers**: Leverage Riverpod for state management

## 🆘 Need Help?

- Check the [Flutter Documentation](https://flutter.dev/docs)
- Review the [Riverpod Guide](https://riverpod.dev/)
- See the `mobile/README.md` for more details
- Check the existing code in `lib/` for examples

Happy coding! 🎉
