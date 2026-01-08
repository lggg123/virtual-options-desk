// server/eodhd-server-fetch.ts
// Server-only EODHD fetch utility

import type { EODMarketData } from '@/lib/blog/simple-blog-agent';

/**
 * Fetches real-time end-of-day market data for multiple symbols from EODHD.
 *
 * @param symbols - Array of symbol strings; each may include an exchange suffix (for example, "AAPL.US"). If a symbol has no suffix, `defaultExchange` is appended.
 * @param apiKey - EODHD API key; required.
 * @param timeoutMs - Per-request timeout in milliseconds. Requests exceeding this are aborted. Defaults to 5000.
 * @param defaultExchange - Exchange suffix to append to symbols that lack one (for example, ".US").
 * @returns An array of market data objects containing `symbol`, `timestamp`, `open`, `high`, `low`, `close`, and `volume`. Symbols that fail to fetch or time out are omitted from the result.
 * @throws Error if `apiKey` is not provided.
 */
export async function fetchEODHDMarketDataServer(
  symbols: string[],
  apiKey: string,
  timeoutMs: number = 5000,
  defaultExchange: string = '.US'
): Promise<EODMarketData[]> {
  if (!apiKey) throw new Error('EODHD API key required');
  // Enforce HTTPS
  const baseUrl = 'https://eodhd.com/api/real-time/';
  const marketData: EODMarketData[] = [];

  const fetchPromises = symbols.map(symbolRaw => {
    let symbol = symbolRaw;
    let exchange = defaultExchange;
    // If symbol already has an exchange suffix, use it
    const match = symbolRaw.match(/^([A-Za-z0-9]+)(\.[A-Za-z]+)$/);
    if (match) {
      symbol = match[1];
      exchange = match[2];
    }
    const controller = new AbortController();
    const signal = controller.signal;
    const url = `${baseUrl}${symbol}${exchange}?fmt=json`;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, {
      signal,
      headers: {
        'X-API-Token': apiKey,
        'Accept': 'application/json',
      },
    })
      .then(res => {
        clearTimeout(timeout);
        if (!res.ok) {
          throw new Error(`Fetch failed for ${symbol}: status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data && typeof data.close === 'number') {
          return {
            symbol: `${symbol}${exchange}`,
            timestamp: new Date().toISOString(),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume ?? 0,
          };
        } else {
          throw new Error(`No close price for ${symbol}`);
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        // Redact sensitive info in logs
        if (err.name === 'AbortError') {
          console.error(`[EODHD] Timeout/Abort for symbol: ${symbol}`);
        } else {
          console.error(`[EODHD] Error for symbol: ${symbol}:`, err.message);
        }
        return null;
      });
  });

  const results = await Promise.all(fetchPromises);
  results.forEach((data, idx) => {
    if (data) {
      marketData.push(data);
    }
  });
  return marketData;
}