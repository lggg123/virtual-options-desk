# Supabase Setup Guide for Virtual Options Desk

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project:
   - **Name**: virtual-options-desk
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the contents of `database/supabase_schema.sql`
4. Click **"Run"**

✅ Your database is now set up with all tables, indexes, and policies!

### Step 3: Get API Credentials

1. Go to **Settings** > **API**
2. Copy these values:

```bash
Project URL: https://xxxxx.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Add to Environment Variables

Update your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database connection string (for Python)
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

### Step 5: Install Supabase Client

```bash
# For Next.js frontend
cd frontend
bun add @supabase/supabase-js

# For Flutter mobile
cd mobile
flutter pub add supabase_flutter
```

## 📊 Database Schema Overview

### Tables Created

1. **monthly_screens** - Tracks each ML screening run
2. **stock_picks** - Individual stock predictions
3. **stock_factors** - Detailed factor values
4. **performance_tracking** - Historical performance metrics
5. **candlestick_patterns** - Pattern detection results

### Views Created

- `latest_screen_summary` - Quick access to latest results
- `top_picks_detailed` - Joined view of picks with all details

## 🔌 Integration Examples

### Next.js (TypeScript)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// With service role (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Python ML Service

```python
# python/db_client.py
from supabase import create_client, Client

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Insert predictions
def save_predictions(screen_id, predictions):
    data = []
    for pred in predictions:
        data.append({
            'screen_id': screen_id,
            'symbol': pred.symbol,
            'ai_score': pred.score,
            'rank': pred.rank,
            'confidence': pred.confidence,
            'risk_score': pred.risk_score,
            # ... other fields
        })
    
    supabase.table('stock_picks').insert(data).execute()
```

### Flutter Mobile

```dart
// lib/services/supabase_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> initSupabase() async {
  await Supabase.initialize(
    url: 'https://xxxxx.supabase.co',
    anonKey: 'your-anon-key',
  );
}

// Get top picks
Future<List<StockPick>> getTopPicks() async {
  final response = await Supabase.instance.client
      .from('stock_picks')
      .select('*')
      .order('rank')
      .limit(100);
  
  return (response as List)
      .map((json) => StockPick.fromJson(json))
      .toList();
}

// Real-time subscription
void subscribeToPatterns(String symbol) {
  Supabase.instance.client
      .from('candlestick_patterns')
      .stream(primaryKey: ['id'])
      .eq('symbol', symbol)
      .listen((data) {
        // Update UI with new patterns
      });
}
```

## 🔒 Security Best Practices

### Row Level Security (RLS)

Already enabled on all tables with policies:
- **Public**: Read-only access
- **Service Role**: Full access for backend operations

### For Production

1. **Restrict public access**:
```sql
-- Update RLS policies to require authentication
CREATE POLICY "Authenticated users can read"
    ON stock_picks FOR SELECT
    USING (auth.role() = 'authenticated');
```

2. **Use service role only server-side**
   - Never expose service role key in client code
   - Use in Python ML service and Next.js API routes only

3. **Enable MFA** on Supabase dashboard

## 📈 Common Queries

### Get Latest Screen Results

```typescript
const { data: latestScreen } = await supabase
  .from('monthly_screens')
  .select('*')
  .order('run_date', { ascending: false })
  .limit(1)
  .single()
```

### Get Top 100 Picks

```typescript
const { data: topPicks } = await supabase
  .from('stock_picks')
  .select(`
    *,
    monthly_screens(run_date, model_version)
  `)
  .eq('screen_id', latestScreen.id)
  .order('rank')
  .limit(100)
```

### Get Stock Details with Factors

```typescript
const { data: stockDetails } = await supabase
  .from('stock_picks')
  .select(`
    *,
    stock_factors(*)
  `)
  .eq('symbol', 'AAPL')
  .single()
```

### Filter by Category and Risk

```typescript
const { data: growthPicks } = await supabase
  .from('stock_picks')
  .select('*')
  .eq('category', 'growth')
  .gte('confidence', 0.7)
  .lte('risk_score', 50)
  .order('rank')
  .limit(50)
```

### Real-time Pattern Detection

```typescript
// Subscribe to new patterns
const channel = supabase
  .channel('patterns')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'candlestick_patterns',
      filter: 'symbol=eq.AAPL'
    },
    (payload) => {
      console.log('New pattern detected:', payload.new)
    }
  )
  .subscribe()
```

## 🔄 Data Migration from ML Service

When your ML models generate predictions:

```python
# After running predictions
def save_monthly_screen(predictions, config):
    # 1. Create screen record
    screen_response = supabase.table('monthly_screens').insert({
        'universe_size': len(universe),
        'picks_generated': len(predictions),
        'model_version': '1.0.0',
        'metadata': config
    }).execute()
    
    screen_id = screen_response.data[0]['id']
    
    # 2. Save all picks
    picks_data = []
    for pred in predictions:
        picks_data.append({
            'screen_id': screen_id,
            'symbol': pred.symbol,
            'company_name': pred.company_name,
            'ai_score': pred.score,
            'rank': pred.rank,
            'confidence': pred.confidence,
            'risk_score': pred.risk_score,
            'predicted_return': pred.predicted_return,
            'category': pred.category,
            'xgboost_score': pred.model_contributions.get('xgboost'),
            'random_forest_score': pred.model_contributions.get('random_forest'),
            'lightgbm_score': pred.model_contributions.get('lightgbm'),
            'lstm_score': pred.model_contributions.get('lstm'),
            'factor_scores': pred.factor_importance
        })
    
    supabase.table('stock_picks').insert(picks_data).execute()
```

## 📊 Dashboard & Monitoring

### Supabase Dashboard Features

1. **Table Editor**: Browse and edit data
2. **SQL Editor**: Run custom queries
3. **API Docs**: Auto-generated API documentation
4. **Database**: Monitor performance and connections
5. **Logs**: Real-time logs for debugging

### Useful Dashboard Queries

```sql
-- Count picks by category
SELECT category, COUNT(*) 
FROM stock_picks 
WHERE screen_id = (SELECT id FROM monthly_screens ORDER BY run_date DESC LIMIT 1)
GROUP BY category;

-- Average confidence by risk score
SELECT 
    CASE 
        WHEN risk_score < 33 THEN 'Low Risk'
        WHEN risk_score < 66 THEN 'Medium Risk'
        ELSE 'High Risk'
    END as risk_category,
    AVG(confidence) as avg_confidence,
    COUNT(*) as count
FROM stock_picks
GROUP BY risk_category;

-- Top performing patterns
SELECT pattern_type, direction, AVG(price_change_1d) as avg_change, COUNT(*)
FROM candlestick_patterns
WHERE pattern_success = true
GROUP BY pattern_type, direction
ORDER BY avg_change DESC;
```

## 🚀 Next Steps

1. ✅ Create Supabase project
2. ✅ Run schema SQL
3. ✅ Add environment variables
4. ✅ Install client libraries
5. Create API routes using Supabase client
6. Update ML service to save predictions to Supabase
7. Build Flutter UI with real-time subscriptions

## 💰 Pricing

**Free Tier Includes:**
- 500 MB database space
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests
- Social Auth
- 1 GB file storage

Perfect for development and small production deployments!

**Upgrade when needed:**
- Pro: $25/month (8GB database, 50GB bandwidth)
- Team: $599/month (multiple members, higher limits)

## 🆘 Troubleshooting

### Connection Issues
```bash
# Test connection
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres"
```

### RLS Blocking Queries
```sql
-- Temporarily disable RLS for testing
ALTER TABLE stock_picks DISABLE ROW LEVEL SECURITY;
```

### Performance Issues
- Add indexes on frequently queried columns
- Use materialized views for complex queries
- Enable connection pooling

---

**Ready to use Supabase!** 🎉

Your database is now cloud-hosted, scalable, and has built-in real-time capabilities perfect for your trading platform.

# Supabase Environment Variables

Add these to your `.env.local` (for local dev) or to Vercel/production environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://qcwtkyxvejcogbhbauey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjd3RreXh2ZWpjb2diaGJhdWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg5NDcsImV4cCI6MjA3NTM1NDk0N30.v6sLdGX4o8tVwMWiPeZGKxAhHE_SKh-vMP1RqrAYGQo
```

- `NEXT_PUBLIC_SUPABASE_URL` is your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is your public anon key (safe for frontend)
