# iOS App API Reference

Complete API documentation for integrating with the Virtual Options Desk backend services.

## 📡 Base URLs

### Development (GitHub Codespaces)
```swift
let patternAPIBase = "https://[your-codespace]-8003.preview.app.github.dev"
let mlAPIBase = "https://[your-codespace]-8002.preview.app.github.dev"
let supabaseURL = "https://nxgtznzhnzlfcofkfbay.supabase.co"
```

### Local Development
```swift
let patternAPIBase = "http://localhost:8003"
let mlAPIBase = "http://localhost:8002"
let supabaseURL = "https://nxgtznzhnzlfcofkfbay.supabase.co"
```

---

## 🔐 Authentication

### Supabase
All Supabase requests require:
```swift
let headers = [
    "apikey": "YOUR_SUPABASE_ANON_KEY",
    "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"
]
```

### Pattern Detection & ML APIs
No authentication required (for now). Add API key in future for production.

---

## 📊 Pattern Detection API (Port 8003)

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "pattern_detection"
}
```

### Detect Patterns
```http
POST /api/patterns/detect
Content-Type: application/json
```

**Request Body:**
```json
{
  "symbol": "AAPL",
  "timeframe": "1d",
  "period": "6mo"
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "patterns": [
    {
      "type": "head_and_shoulders",
      "confidence": 0.85,
      "timestamp": "2025-10-05T14:30:00Z",
      "price_level": 175.50,
      "signal": "bearish"
    },
    {
      "type": "double_bottom",
      "confidence": 0.72,
      "timestamp": "2025-10-03T10:15:00Z",
      "price_level": 168.25,
      "signal": "bullish"
    }
  ],
  "analysis": {
    "trend": "bullish",
    "support_levels": [168.0, 165.5],
    "resistance_levels": [178.0, 182.5]
  }
}
```

**Swift Example:**
```swift
struct PatternRequest: Codable {
    let symbol: String
    let timeframe: String
    let period: String?
}

struct Pattern: Codable {
    let type: String
    let confidence: Double
    let timestamp: String
    let priceLevel: Double
    let signal: String
    
    enum CodingKeys: String, CodingKey {
        case type, confidence, timestamp, signal
        case priceLevel = "price_level"
    }
}

func detectPatterns(symbol: String) async throws -> [Pattern] {
    let url = URL(string: "\(patternAPIBase)/api/patterns/detect")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = PatternRequest(symbol: symbol, timeframe: "1d", period: "6mo")
    request.httpBody = try JSONEncoder().encode(body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode([String: [Pattern]].self, from: data)
    return response["patterns"] ?? []
}
```

---

## 🤖 ML Stock Screening API (Port 8002)

### Health Check
```http
GET /health
```

### Get AI Stock Picks
```http
GET /api/predictions
```

**Response:**
```json
{
  "predictions": [
    {
      "symbol": "AAPL",
      "company_name": "Apple Inc.",
      "ai_score": 92.5,
      "confidence": 0.88,
      "predicted_return": 18.5,
      "risk_score": 22.3,
      "category": "growth",
      "model_scores": {
        "xgboost": 0.35,
        "random_forest": 0.25,
        "lightgbm": 0.30,
        "lstm": 0.10
      }
    }
  ],
  "generated_at": "2025-10-06T10:00:00Z",
  "total_stocks": 10
}
```

### Predict Specific Symbols
```http
POST /api/predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "symbols": ["AAPL", "MSFT", "GOOGL"]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "symbol": "AAPL",
      "predicted_return": 18.5,
      "confidence": 0.88,
      "risk_score": 22.3
    }
  ]
}
```

**Swift Example:**
```swift
struct StockPrediction: Codable {
    let symbol: String
    let companyName: String
    let aiScore: Double
    let confidence: Double
    let predictedReturn: Double
    let riskScore: Double
    let category: String
    let modelScores: ModelScores
    
    enum CodingKeys: String, CodingKey {
        case symbol, confidence, category
        case companyName = "company_name"
        case aiScore = "ai_score"
        case predictedReturn = "predicted_return"
        case riskScore = "risk_score"
        case modelScores = "model_scores"
    }
}

struct ModelScores: Codable {
    let xgboost: Double
    let randomForest: Double
    let lightgbm: Double
    let lstm: Double
    
    enum CodingKeys: String, CodingKey {
        case xgboost, lightgbm, lstm
        case randomForest = "random_forest"
    }
}

func fetchStockPicks() async throws -> [StockPrediction] {
    let url = URL(string: "\(mlAPIBase)/api/predictions")!
    let (data, _) = try await URLSession.shared.data(from: url)
    let response = try JSONDecoder().decode([String: [StockPrediction]].self, from: data)
    return response["predictions"] ?? []
}
```

---

## 💾 Supabase Database API

### Get Stock Picks
```http
GET https://nxgtznzhnzlfcofkfbay.supabase.co/rest/v1/stock_picks
  ?select=*
  &order=rank.asc
  &limit=20

Headers:
  apikey: YOUR_SUPABASE_ANON_KEY
  Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

**Response:**
```json
[
  {
    "id": "uuid",
    "symbol": "AAPL",
    "company_name": "Apple Inc.",
    "rank": 1,
    "ai_score": 92.5,
    "confidence": 0.88,
    "risk_score": 22.3,
    "predicted_return": 18.5,
    "category": "growth",
    "xgboost_score": 0.35,
    "random_forest_score": 0.25,
    "lightgbm_score": 0.30,
    "lstm_score": 0.10,
    "factor_scores": {
      "revenue_growth": 0.28,
      "momentum": 0.22,
      "market_sentiment": 0.18
    },
    "created_at": "2025-10-06T00:00:00Z",
    "updated_at": "2025-10-06T10:00:00Z"
  }
]
```

### Filter by Category
```http
GET /rest/v1/stock_picks?category=eq.growth&select=*
```

### Search by Symbol
```http
GET /rest/v1/stock_picks?symbol=eq.AAPL&select=*
```

### Real-time Subscriptions
```swift
import Supabase

let client = SupabaseClient(
    supabaseURL: URL(string: "https://nxgtznzhnzlfcofkfbay.supabase.co")!,
    supabaseKey: "YOUR_ANON_KEY"
)

// Subscribe to stock picks changes
let subscription = await client
    .from("stock_picks")
    .on(.all) { payload in
        print("Change detected:", payload)
        // Update your UI
    }
    .subscribe()
```

**Swift Example (Complete):**
```swift
struct StockPick: Codable {
    let id: UUID
    let symbol: String
    let companyName: String
    let rank: Int
    let aiScore: Double
    let confidence: Double
    let riskScore: Double
    let predictedReturn: Double
    let category: String
    let xgboostScore: Double
    let randomForestScore: Double
    let lightgbmScore: Double
    let lstmScore: Double
    let factorScores: [String: Double]
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, symbol, rank, confidence, category
        case companyName = "company_name"
        case aiScore = "ai_score"
        case riskScore = "risk_score"
        case predictedReturn = "predicted_return"
        case xgboostScore = "xgboost_score"
        case randomForestScore = "random_forest_score"
        case lightgbmScore = "lightgbm_score"
        case lstmScore = "lstm_score"
        case factorScores = "factor_scores"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

func fetchStockPicksFromSupabase() async throws -> [StockPick] {
    let url = URL(string: "https://nxgtznzhnzlfcofkfbay.supabase.co/rest/v1/stock_picks?select=*&order=rank.asc&limit=100")!
    var request = URLRequest(url: url)
    request.setValue("YOUR_ANON_KEY", forHTTPHeaderField: "apikey")
    request.setValue("Bearer YOUR_ANON_KEY", forHTTPHeaderField: "Authorization")
    
    let (data, _) = try await URLSession.shared.data(for: request)
    
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return try decoder.decode([StockPick].self, from: data)
}
```

---

## 🚀 Starting Backend Services

### In GitHub Codespaces:
```bash
# Start all services
./start-dev.sh

# Or start individually:
./start-pattern-service.sh  # Port 8003
./start-ml-service.sh        # Port 8002
```

### Make Ports Public:
1. Go to **Ports** tab in Codespaces
2. Right-click each port (8002, 8003)
3. Change visibility to **Public**
4. Copy the forwarded URL
5. Use in your iOS app

---

## 📝 Environment Configuration

Create a `Config.swift` in your iOS app:

```swift
enum Environment {
    case development
    case production
    
    static let current: Environment = .development
}

struct APIConfig {
    static var patternAPI: String {
        switch Environment.current {
        case .development:
            return "http://localhost:8003"
        case .production:
            return "https://your-production-url-8003.com"
        }
    }
    
    static var mlAPI: String {
        switch Environment.current {
        case .development:
            return "http://localhost:8002"
        case .production:
            return "https://your-production-url-8002.com"
        }
    }
    
    static let supabaseURL = "https://nxgtznzhnzlfcofkfbay.supabase.co"
    static let supabaseAnonKey = "YOUR_ANON_KEY" // Store securely!
}
```

---

## ⚠️ Error Handling

All APIs return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (check your parameters)
- `404` - Not Found
- `500` - Server Error

**Example Error Response:**
```json
{
  "detail": "Error message here"
}
```

**Swift Error Handling:**
```swift
enum APIError: Error {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(String)
}

func handleAPICall<T: Decodable>(_ urlString: String) async throws -> T {
    guard let url = URL(string: urlString) else {
        throw APIError.invalidURL
    }
    
    do {
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(NSError(domain: "", code: -1))
        }
        
        guard httpResponse.statusCode == 200 else {
            let error = try? JSONDecoder().decode([String: String].self, from: data)
            throw APIError.serverError(error?["detail"] ?? "Unknown error")
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    } catch let error as DecodingError {
        throw APIError.decodingError(error)
    } catch {
        throw APIError.networkError(error)
    }
}
```

---

## 🧪 Testing

### Test Pattern API:
```bash
curl -X POST http://localhost:8003/api/patterns/detect \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "timeframe": "1d"}'
```

### Test ML API:
```bash
curl http://localhost:8002/api/predictions
```

### Test Supabase:
```bash
curl "https://nxgtznzhnzlfcofkfbay.supabase.co/rest/v1/stock_picks?select=symbol,ai_score&limit=5" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📚 Additional Resources

- [Supabase Swift SDK](https://github.com/supabase-community/supabase-swift)
- [Pattern Detection Guide](./PATTERN_DETECTION_GUIDE.md)
- [ML Implementation Summary](./ML_IMPLEMENTATION_SUMMARY.md)
- [Database Setup](../database/SUPABASE_SETUP.md)

---

## 🆘 Troubleshooting

### Ports Not Accessible
- Make sure ports are set to **Public** in Codespaces
- Check firewall settings
- Verify services are running: `lsof -i :8002,8003`

### Empty Data
- Check if database is populated: See `populate_supabase.py`
- Verify Supabase credentials

### API Errors
- Check service logs in terminal
- Verify request format matches documentation
- Test with curl first before iOS implementation
