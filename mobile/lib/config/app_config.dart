class AppConfig {
  // API Configuration
  static const String apiBaseUrl = 'http://localhost:3000'; // Update with your backend URL
  static const String wsBaseUrl = 'ws://localhost:3000'; // WebSocket URL
  
  // API Endpoints
  static const String marketDataEndpoint = '/api/market-data';
  static const String optionsEndpoint = '/api/options';
  static const String positionsEndpoint = '/api/positions';
  
  // App Configuration
  static const int dataRefreshInterval = 5000; // milliseconds
  static const int maxCandlesToShow = 100;
}
