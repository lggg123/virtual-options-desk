// Supabase configuration constants
export const SUPABASE_CONFIG = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'virtual-options-desk',
    },
  },
} as const;

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  OPTIONS_TRADES: 'options_trades',
  WATCHLIST: 'watchlist',
  PORTFOLIOS: 'portfolios',
} as const;

// Option types
export const OPTION_TYPES = {
  CALL: 'call',
  PUT: 'put',
} as const;

// Trade actions
export const TRADE_ACTIONS = {
  BUY: 'buy',
  SELL: 'sell',
} as const;

// Order types
export const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
  STOP_LIMIT: 'stop_limit',
} as const;

// Time frames for charts
export const TIME_FRAMES = {
  '1D': '1D',
  '5D': '5D',
  '1M': '1M',
  '3M': '3M',
  '6M': '6M',
  '1Y': '1Y',
  '2Y': '2Y',
  '5Y': '5Y',
} as const;

// Market data refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  MARKET_DATA: 5000, // 5 seconds
  PORTFOLIO: 30000, // 30 seconds
  OPTIONS_CHAIN: 10000, // 10 seconds
} as const;

// Risk management constants
export const RISK_LIMITS = {
  MAX_POSITION_SIZE_PERCENT: 10, // 10% of portfolio
  MAX_DAILY_LOSS_PERCENT: 5, // 5% daily loss limit
  MIN_ACCOUNT_BALANCE: 1000, // Minimum account balance
} as const;

// Greeks thresholds for risk assessment
export const GREEKS_THRESHOLDS = {
  DELTA: {
    LOW: 0.3,
    HIGH: 0.7,
  },
  GAMMA: {
    LOW: 0.01,
    HIGH: 0.05,
  },
  THETA: {
    LOW: -0.05,
    HIGH: -0.20,
  },
  VEGA: {
    LOW: 0.05,
    HIGH: 0.20,
  },
} as const;

// Market hours (Eastern Time)
export const MARKET_HOURS = {
  OPEN: '09:30',
  CLOSE: '16:00',
  PRE_MARKET_START: '04:00',
  AFTER_HOURS_END: '20:00',
} as const;

// Common option expiration patterns
export const EXPIRATION_PATTERNS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  LEAPS: 'leaps',
} as const;