# 🚀 Virtual Options Desk - Complete Startup Guide

## Backend Services for iOS App

This repository provides backend APIs and services consumed by a separate iOS application.

## Services Overview

### Core Backend Services:
- **Pattern Detection API** - Port 8003 (technical pattern analysis)
- **ML Stock Screening API** - Port 8002 (AI-powered stock predictions)
- **Next.js Web App** - Port 3000 (options trading simulator)
- **CrewAI Service** - Port 8001 (optional AI enhancement)

### Database:
- **Supabase** - Cloud PostgreSQL database
- Stores stock picks, ML predictions, and real-time data
- See `database/SUPABASE_SETUP.md` for configuration

## Quick Access URLs

### In GitHub Codespaces:
1. Go to **Ports** tab
2. Make ports **public** (click the lock icon)
3. Copy the forwarded URLs:

**Pattern Detection API**: Port 8003
- Local: http://localhost:8003
- Public: `https://[your-codespace-name]-8003.preview.app.github.dev`

**ML API**: Port 8002
- Local: http://localhost:8002
- Public: `https://[your-codespace-name]-8002.preview.app.github.dev`

**Next.js Web App**: Port 3000
- Local: http://localhost:3000  
- Public: `https://[your-codespace-name]-3000.preview.app.github.dev`

---

## 🚀 Starting Backend Services

### Option 1: Start All Services (Recommended)
Use the convenience script:
```bash
./start-dev.sh
```

This starts:
- Next.js web app (port 3000)
- Pattern Detection API (port 8003)
- ML Stock Screening API (port 8002)

### Option 2: Start Services Individually

**Pattern Detection API:**
```bash
./start-pattern-service.sh
# Serves on http://localhost:8003
```

**ML Stock Screening API:**
```bash
./start-ml-service.sh
# Serves on http://localhost:8002
```

**Next.js Web App:**
```bash
cd frontend && bun run dev
# Serves on http://localhost:3000
```

**CrewAI Service (Optional):**
```bash
cd crewai-service && python3 main.py
# Serves on http://localhost:8001
```

---

## � Connecting Your iOS App

### 1. Configure Supabase
Your iOS app needs these Supabase credentials:

```swift
let supabaseURL = "https://nxgtznzhnzlfcofkfbay.supabase.co"
let supabaseAnonKey = "eyJhbGc..." // Get from .env file
```

### 2. Configure API Endpoints
In GitHub Codespaces, make ports public and use the forwarded URLs:

```swift
let patternAPI = "https://[codespace]-8003.preview.app.github.dev"
let mlAPI = "https://[codespace]-8002.preview.app.github.dev"
```

For local development:
```swift
let patternAPI = "http://localhost:8003"
let mlAPI = "http://localhost:8002"
```

### 3. Test API Connection
```bash
# Test Pattern Detection API
curl http://localhost:8003/health

# Test ML API
curl http://localhost:8002/health

# Test Supabase connection
curl "https://nxgtznzhnzlfcofkfbay.supabase.co/rest/v1/stock_picks?select=symbol,ai_score&limit=5" \
  -H "apikey: YOUR_ANON_KEY"
```

---

## 🐛 Debug Commands

**Check what's running:**
```bash
lsof -i -P -n | grep LISTEN
```

**Check Python service logs:**
```bash
# Pattern Detection logs
tail -f pattern_service.log

# ML Service logs (if logging enabled)
tail -f ml_service.log
```

**Test Supabase connection:**
```bash
curl "https://nxgtznzhnzlfcofkfbay.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"
```

**Verify database has data:**
```bash
curl "https://nxgtznzhnzlfcofkfbay.supabase.co/rest/v1/stock_picks?limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📞 Next Steps

Tell me:
1. Do you want to try **Next.js on iPhone** (easiest)?
2. Do you want to **debug Flutter web more** (harder)?
3. Do you want to **build native iOS app** (requires more setup)?
