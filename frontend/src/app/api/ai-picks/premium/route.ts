import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  symbol: string;
  date: string;
  predicted_return_30d: string;
  breakout_probability: string;
  Industry?: string;
  'Market Cap'?: string;
  volume?: string;
  volatility_20d?: string;
  volatility_60d?: string;
  rsi_14?: string;
  momentum_20d?: string;
  volume_ratio?: string;
  xgboost_prediction?: string;
  lightgbm_prediction?: string;
}

interface StockPick {
  symbol: string;
  name: string;
  prediction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  target_price: number;
  current_price: number;
  potential_return: number;
  reasoning: string;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch CSV via HTTP (works on serverless)
    const baseUrl = request.nextUrl.origin;
    const csvUrl = `${baseUrl}/data/top50_premium.csv`;
    console.log(`[AI Picks Premium] Fetching CSV from: ${csvUrl}`);

    const csvResponse = await fetch(csvUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }
    const csv = await csvResponse.text();
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');

    const rawData: CSVRow[] = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v])) as unknown as CSVRow;
    });

    const picks: StockPick[] = rawData.slice(0, 50).map((row) => {
      const predictedReturn = parseFloat(row.predicted_return_30d);
      const breakoutProb = parseFloat(row.breakout_probability);
      const volatility20d = row.volatility_20d ? parseFloat(row.volatility_20d) : null;
      const volatility60d = row.volatility_60d ? parseFloat(row.volatility_60d) : null;
      const rsi = row.rsi_14 ? parseFloat(row.rsi_14) : null;
      const momentum = row.momentum_20d ? parseFloat(row.momentum_20d) : null;
      const volumeRatio = row.volume_ratio ? parseFloat(row.volume_ratio) : null;
      const volume = row.volume ? parseFloat(row.volume) : null;
      const xgbPred = row.xgboost_prediction ? parseFloat(row.xgboost_prediction) : null;
      const lgbPred = row.lightgbm_prediction ? parseFloat(row.lightgbm_prediction) : null;

      // Determine prediction based on predicted return
      let prediction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (predictedReturn > 1) prediction = 'bullish';
      else if (predictedReturn < -1) prediction = 'bearish';

      // Confidence based on model agreement and prediction strength
      let modelAgreement = 0;
      if (xgbPred !== null && lgbPred !== null) {
        // If both models agree on direction, higher confidence
        if ((xgbPred > 0 && lgbPred > 0) || (xgbPred < 0 && lgbPred < 0)) {
          modelAgreement = 0.1;
        }
      }
      const confidence = Math.min(0.99, Math.abs(predictedReturn) / 10 + breakoutProb * 0.3 + modelAgreement);

      // Estimate prices (client will fetch real quotes)
      const estimatedPrice = 100;
      const targetPrice = estimatedPrice * (1 + predictedReturn / 100);

      // Build comprehensive reasoning for premium users
      const reasoningParts: string[] = [];
      reasoningParts.push('Premium Analysis:');
      if (row.Industry) reasoningParts.push(`${row.Industry} sector.`);
      reasoningParts.push(`ML ensemble predicts ${predictedReturn > 0 ? '+' : ''}${predictedReturn.toFixed(1)}% return.`);

      // Model breakdown
      if (xgbPred !== null && lgbPred !== null) {
        reasoningParts.push(`XGBoost: ${xgbPred > 0 ? '+' : ''}${xgbPred.toFixed(1)}%, LightGBM: ${lgbPred > 0 ? '+' : ''}${lgbPred.toFixed(1)}%.`);
      }

      if (breakoutProb > 0.05) reasoningParts.push(`Breakout prob: ${(breakoutProb * 100).toFixed(0)}%.`);

      // RSI analysis
      if (rsi !== null) {
        if (rsi < 30) reasoningParts.push('RSI oversold.');
        else if (rsi > 70) reasoningParts.push('RSI overbought.');
        else reasoningParts.push(`RSI: ${rsi.toFixed(0)}.`);
      }

      // Momentum
      if (momentum !== null) {
        if (momentum > 0.05) reasoningParts.push('Strong upward momentum.');
        else if (momentum < -0.05) reasoningParts.push('Negative momentum.');
      }

      // Volatility analysis
      if (volatility20d !== null && volatility60d !== null) {
        if (volatility20d > 1) reasoningParts.push('High short-term volatility.');
        if (volatility20d > volatility60d * 1.2) reasoningParts.push('Volatility increasing.');
        else if (volatility20d < volatility60d * 0.8) reasoningParts.push('Volatility decreasing.');
      }

      // Volume analysis
      if (volumeRatio !== null && volumeRatio > 1.5) {
        reasoningParts.push('Above-average volume.');
      }
      if (volume && volume > 1000000) {
        reasoningParts.push(`Vol: ${(volume / 1000000).toFixed(1)}M.`);
      }

      return {
        symbol: row.symbol,
        name: row.symbol, // Client will update with real name
        prediction,
        confidence,
        target_price: targetPrice,
        current_price: estimatedPrice,
        potential_return: predictedReturn,
        reasoning: reasoningParts.join(' '),
      };
    });

    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Premium] Error:', err);
    return NextResponse.json({
      error: 'Could not read premium picks.',
      picks: []
    }, { status: 500 });
  }
}
