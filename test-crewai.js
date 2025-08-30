#!/usr/bin/env node
/**
 * Test script for CrewAI analysis service
 */

import { getCrewAIService } from './src/lib/analysis/index.js';

// Mock market data
const mockMarketData = [
  { price: 100, volume: 1000, timestamp: '2024-01-01T10:00:00Z' },
  { price: 102, volume: 1200, timestamp: '2024-01-01T10:15:00Z' },
  { price: 105, volume: 1500, timestamp: '2024-01-01T10:30:00Z' },
  { price: 103, volume: 1100, timestamp: '2024-01-01T10:45:00Z' },
  { price: 107, volume: 1800, timestamp: '2024-01-01T11:00:00Z' },
  { price: 110, volume: 2000, timestamp: '2024-01-01T11:15:00Z' },
  { price: 108, volume: 1600, timestamp: '2024-01-01T11:30:00Z' },
];

async function testCrewAI() {
  console.log('🧪 Testing CrewAI Analysis Service...\n');
  
  try {
    // Initialize service
    const crewaiService = getCrewAIService({
      pythonPath: 'python3'
    });
    
    console.log('📊 Analyzing market trend...');
    const analysis = await crewaiService.analyzeMarketTrend(mockMarketData, '1D');
    
    console.log('\n✅ Analysis Results:');
    console.log('==================');
    console.log(`Trend: ${analysis.trend.toUpperCase()}`);
    console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`Reasoning: ${analysis.reasoning}`);
    console.log(`Time Horizon: ${analysis.timeHorizon}`);
    
    if (analysis.metrics) {
      console.log('\n📈 Metrics:');
      console.log(`Current Price: $${analysis.metrics.current_price.toFixed(2)}`);
      console.log(`Price Change: $${analysis.metrics.price_change.toFixed(2)} (${analysis.metrics.price_change_pct.toFixed(2)}%)`);
      console.log(`Momentum: ${analysis.metrics.momentum.toFixed(4)}`);
      console.log(`Volatility: ${(analysis.metrics.volatility * 100).toFixed(2)}%`);
    }
    
    if (analysis.support_resistance) {
      console.log('\n🎯 Support/Resistance:');
      console.log(`Support: $${analysis.support_resistance.support.toFixed(2)}`);
      console.log(`Resistance: $${analysis.support_resistance.resistance.toFixed(2)}`);
      console.log(`Pivot: $${analysis.support_resistance.pivot.toFixed(2)}`);
    }
    
    if (analysis.splineData) {
      console.log('\n📉 3D Spline Data Points:', analysis.splineData.x.length);
    }
    
    if (analysis.error) {
      console.log(`\n⚠️  Note: ${analysis.message}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testCrewAI();