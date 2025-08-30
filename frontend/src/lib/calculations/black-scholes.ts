// lib/calculations/black-scholes.ts
import { cdf, pdf } from './statistics';

export interface OptionPricingInputs {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  volatility: number;
  optionType: 'call' | 'put';
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function calculateBlackScholes(inputs: OptionPricingInputs): {
  price: number;
  greeks: Greeks;
} {
  const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType } = inputs;
  
  if (timeToExpiry <= 0) {
    // Option has expired
    const intrinsicValue = optionType === 'call' 
      ? Math.max(0, spotPrice - strikePrice)
      : Math.max(0, strikePrice - spotPrice);
    
    return {
      price: intrinsicValue,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
    };
  }
  
  const sqrtT = Math.sqrt(timeToExpiry);
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility ** 2) * timeToExpiry) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  
  const Nd1 = cdf(d1);
  const Nd2 = cdf(d2);
  const Nminusd1 = cdf(-d1);
  const Nminusd2 = cdf(-d2);
  const nd1 = pdf(d1);
  
  let price: number;
  let delta: number;
  
  if (optionType === 'call') {
    price = spotPrice * Nd1 - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2;
    delta = Nd1;
  } else {
    price = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nminusd2 - spotPrice * Nminusd1;
    delta = -Nminusd1;
  }
  
  // Greeks calculations
  const gamma = nd1 / (spotPrice * volatility * sqrtT);
  const theta = optionType === 'call'
    ? -(spotPrice * nd1 * volatility / (2 * sqrtT) + riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2) / 365
    : -(spotPrice * nd1 * volatility / (2 * sqrtT) - riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nminusd2) / 365;
  const vega = spotPrice * nd1 * sqrtT / 100;
  const rho = optionType === 'call'
    ? strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * Nd2 / 100
    : -strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * Nminusd2 / 100;
  
  return {
    price: Math.round(price * 100) / 100,
    greeks: {
      delta: Math.round(delta * 1000) / 1000,
      gamma: Math.round(gamma * 1000) / 1000,
      theta: Math.round(theta * 1000) / 1000,
      vega: Math.round(vega * 1000) / 1000,
      rho: Math.round(rho * 1000) / 1000
    }
  };
}