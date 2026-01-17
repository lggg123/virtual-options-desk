/**
 * Binomial Tree Options Pricing Model (Cox-Ross-Rubinstein)
 *
 * This implements the CRR binomial tree model for pricing both American and European options.
 * American options can be exercised at any time before expiry, while European options can
 * only be exercised at expiry.
 *
 * HOW IT WORKS:
 * 1. Build a tree of possible stock prices from now until expiry
 * 2. At each time step, the stock can go UP (multiply by u) or DOWN (multiply by d)
 * 3. At expiry, calculate option payoffs (intrinsic values)
 * 4. Work backwards through the tree, calculating option values at each node
 * 5. For American options, check at each node if early exercise is optimal
 *
 * KEY FORMULAS:
 * - Δt = T/n (time step size)
 * - u = e^(σ√Δt) (up factor)
 * - d = 1/u = e^(-σ√Δt) (down factor)
 * - p = (e^(rΔt) - d) / (u - d) (risk-neutral probability of up move)
 *
 * WHY BINOMIAL TREES?
 * - Handles American options (early exercise) which Black-Scholes cannot
 * - Intuitive and easy to understand
 * - Converges to Black-Scholes as number of steps increases
 * - Can be extended for dividends, barriers, etc.
 */

import type { OptionPricingInputs, Greeks } from './black-scholes';

// Re-export types for convenience
export type { OptionPricingInputs, Greeks };

/**
 * Option style - American can be exercised any time, European only at expiry
 */
export type OptionStyle = 'american' | 'european';

/**
 * Extended inputs for binomial model
 */
export interface BinomialTreeInputs extends OptionPricingInputs {
  optionStyle?: OptionStyle;  // Default: 'american' (most US equity options)
  steps?: number;             // Default: 100 (good balance of speed/accuracy)
  dividendYield?: number;     // Annual dividend yield (0.02 = 2%)
}

/**
 * Detailed output including tree information for educational purposes
 */
export interface BinomialTreeOutput {
  price: number;
  greeks: Greeks;
  optionStyle: OptionStyle;
  steps: number;
  earlyExerciseNodes?: number;  // Number of nodes where early exercise is optimal (American only)
  convergenceInfo?: {
    blackScholesPrice: number;  // For comparison
    difference: number;         // Binomial - Black-Scholes
    percentDiff: number;        // Percentage difference
  };
}

/**
 * Main pricing function using the Cox-Ross-Rubinstein binomial tree model
 *
 * @example
 * const result = calculateBinomialTree({
 *   spotPrice: 100,
 *   strikePrice: 105,
 *   timeToExpiry: 0.25,  // 3 months
 *   riskFreeRate: 0.05,  // 5%
 *   volatility: 0.25,    // 25%
 *   optionType: 'put',
 *   optionStyle: 'american',  // Can exercise early
 *   steps: 100
 * });
 */
export function calculateBinomialTree(inputs: BinomialTreeInputs): BinomialTreeOutput {
  const {
    spotPrice: S,
    strikePrice: K,
    timeToExpiry: T,
    riskFreeRate: r,
    volatility: sigma,
    optionType,
    optionStyle = 'american',  // Default to American for US equity options
    steps: n = 100,            // 100 steps provides good accuracy
    dividendYield: q = 0,      // Default no dividends
  } = inputs;

  // Handle expired options
  if (T <= 0) {
    const intrinsicValue = optionType === 'call'
      ? Math.max(0, S - K)
      : Math.max(0, K - S);

    return {
      price: intrinsicValue,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
      optionStyle,
      steps: n,
    };
  }

  // Calculate tree parameters
  const dt = T / n;                           // Time step size
  const u = Math.exp(sigma * Math.sqrt(dt));  // Up factor
  const d = 1 / u;                            // Down factor (ensures recombining tree)
  const discount = Math.exp(-r * dt);         // Discount factor per step

  // Risk-neutral probability of up move
  // Adjusted for dividend yield: use (r - q) instead of r
  const p = (Math.exp((r - q) * dt) - d) / (u - d);

  // Validate probability (should be between 0 and 1)
  if (p < 0 || p > 1) {
    console.warn('Risk-neutral probability outside [0,1], parameters may be extreme');
  }

  /**
   * STEP 1: Build stock price tree (only need final column for pricing)
   *
   * At step i, node j, stock price = S * u^j * d^(i-j)
   * At expiry (step n), prices are: S*d^n, S*d^(n-1)*u, S*d^(n-2)*u^2, ..., S*u^n
   */
  const stockPrices: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) {
    // Stock price at expiry node j (j up moves, n-j down moves)
    stockPrices[j] = S * Math.pow(u, j) * Math.pow(d, n - j);
  }

  /**
   * STEP 2: Calculate option values at expiry (intrinsic values)
   *
   * Call payoff: max(S - K, 0)
   * Put payoff:  max(K - S, 0)
   */
  let optionValues: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) {
    if (optionType === 'call') {
      optionValues[j] = Math.max(0, stockPrices[j] - K);
    } else {
      optionValues[j] = Math.max(0, K - stockPrices[j]);
    }
  }

  /**
   * STEP 3: Work backwards through the tree
   *
   * At each node, option value is:
   * - European: discounted expected value = e^(-rΔt) * [p * V_up + (1-p) * V_down]
   * - American: max(intrinsic value, continuation value)
   *
   * This is where American options differ - we check if early exercise is better
   */
  let earlyExerciseCount = 0;

  for (let i = n - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      // Current stock price at this node
      const currentStock = S * Math.pow(u, j) * Math.pow(d, i - j);

      // Continuation value (hold the option)
      const continuationValue = discount * (p * optionValues[j + 1] + (1 - p) * optionValues[j]);

      // Intrinsic value (exercise now)
      const intrinsicValue = optionType === 'call'
        ? Math.max(0, currentStock - K)
        : Math.max(0, K - currentStock);

      if (optionStyle === 'american') {
        // American option: choose better of exercise or hold
        if (intrinsicValue > continuationValue) {
          optionValues[j] = intrinsicValue;
          earlyExerciseCount++;
        } else {
          optionValues[j] = continuationValue;
        }
      } else {
        // European option: can only hold until expiry
        optionValues[j] = continuationValue;
      }
    }
  }

  const price = optionValues[0];

  /**
   * STEP 4: Calculate Greeks using finite differences
   *
   * We reprice the option with small changes to inputs to estimate sensitivities.
   * This is more accurate than analytical formulas for American options.
   */
  const greeks = calculateGreeksFiniteDifference({
    ...inputs,
    optionStyle,
    steps: n,
    dividendYield: q,
  }, price);

  return {
    price: Math.round(price * 100) / 100,
    greeks,
    optionStyle,
    steps: n,
    earlyExerciseNodes: optionStyle === 'american' ? earlyExerciseCount : undefined,
  };
}

/**
 * Calculate Greeks using finite difference method
 *
 * This works by repricing the option with small changes to each input:
 * - Delta: ∂V/∂S ≈ (V(S+h) - V(S-h)) / (2h)
 * - Gamma: ∂²V/∂S² ≈ (V(S+h) - 2V(S) + V(S-h)) / h²
 * - Theta: ∂V/∂t ≈ (V(T-h) - V(T)) / h (time decay)
 * - Vega: ∂V/∂σ ≈ (V(σ+h) - V(σ-h)) / (2h)
 * - Rho: ∂V/∂r ≈ (V(r+h) - V(r-h)) / (2h)
 */
function calculateGreeksFiniteDifference(inputs: BinomialTreeInputs, basePrice: number): Greeks {
  const { spotPrice: S, volatility: sigma, riskFreeRate: r, timeToExpiry: T } = inputs;

  // Step sizes for finite differences
  const dS = S * 0.01;        // 1% of spot price
  const dSigma = 0.01;        // 1% volatility change
  const dR = 0.01;            // 1% rate change
  const dT = 1 / 365;         // 1 day

  // Helper to reprice with modified inputs
  const reprice = (overrides: Partial<BinomialTreeInputs>): number => {
    return calculateBinomialTreeInternal({ ...inputs, ...overrides });
  };

  // Delta: sensitivity to stock price
  const priceUp = reprice({ spotPrice: S + dS });
  const priceDown = reprice({ spotPrice: S - dS });
  const delta = (priceUp - priceDown) / (2 * dS);

  // Gamma: rate of change of delta
  const gamma = (priceUp - 2 * basePrice + priceDown) / (dS * dS);

  // Theta: time decay (negative because options lose value over time)
  // We calculate value with less time remaining
  let theta = 0;
  if (T > dT) {
    const priceLessTime = reprice({ timeToExpiry: T - dT });
    theta = (priceLessTime - basePrice) / dT / 365;  // Daily theta
  }

  // Vega: sensitivity to volatility (per 1% change)
  const priceHighVol = reprice({ volatility: sigma + dSigma });
  const priceLowVol = reprice({ volatility: Math.max(0.01, sigma - dSigma) });
  const vega = (priceHighVol - priceLowVol) / (2 * dSigma) / 100;

  // Rho: sensitivity to interest rate (per 1% change)
  const priceHighRate = reprice({ riskFreeRate: r + dR });
  const priceLowRate = reprice({ riskFreeRate: Math.max(0.001, r - dR) });
  const rho = (priceHighRate - priceLowRate) / (2 * dR) / 100;

  return {
    delta: Math.round(delta * 1000) / 1000,
    gamma: Math.round(gamma * 1000) / 1000,
    theta: Math.round(theta * 1000) / 1000,
    vega: Math.round(vega * 1000) / 1000,
    rho: Math.round(rho * 1000) / 1000,
  };
}

/**
 * Internal pricing function (without Greeks) for finite difference calculations
 * This avoids recursive Greeks calculations
 */
function calculateBinomialTreeInternal(inputs: BinomialTreeInputs): number {
  const {
    spotPrice: S,
    strikePrice: K,
    timeToExpiry: T,
    riskFreeRate: r,
    volatility: sigma,
    optionType,
    optionStyle = 'american',
    steps: n = 100,
    dividendYield: q = 0,
  } = inputs;

  if (T <= 0) {
    return optionType === 'call'
      ? Math.max(0, S - K)
      : Math.max(0, K - S);
  }

  const dt = T / n;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const discount = Math.exp(-r * dt);
  const p = (Math.exp((r - q) * dt) - d) / (u - d);

  // Initialize option values at expiry
  let optionValues: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) {
    const stockPrice = S * Math.pow(u, j) * Math.pow(d, n - j);
    optionValues[j] = optionType === 'call'
      ? Math.max(0, stockPrice - K)
      : Math.max(0, K - stockPrice);
  }

  // Backward induction
  for (let i = n - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      const continuationValue = discount * (p * optionValues[j + 1] + (1 - p) * optionValues[j]);

      if (optionStyle === 'american') {
        const currentStock = S * Math.pow(u, j) * Math.pow(d, i - j);
        const intrinsicValue = optionType === 'call'
          ? Math.max(0, currentStock - K)
          : Math.max(0, K - currentStock);
        optionValues[j] = Math.max(intrinsicValue, continuationValue);
      } else {
        optionValues[j] = continuationValue;
      }
    }
  }

  return optionValues[0];
}

/**
 * Compare American vs European pricing to show early exercise value
 *
 * This is educational - shows how much extra an American option is worth
 * due to the early exercise feature.
 */
export function compareAmericanVsEuropean(inputs: Omit<BinomialTreeInputs, 'optionStyle'>): {
  american: BinomialTreeOutput;
  european: BinomialTreeOutput;
  earlyExercisePremium: number;
  earlyExercisePremiumPercent: number;
} {
  const american = calculateBinomialTree({ ...inputs, optionStyle: 'american' });
  const european = calculateBinomialTree({ ...inputs, optionStyle: 'european' });

  const premium = american.price - european.price;
  const premiumPercent = european.price > 0 ? (premium / european.price) * 100 : 0;

  return {
    american,
    european,
    earlyExercisePremium: Math.round(premium * 100) / 100,
    earlyExercisePremiumPercent: Math.round(premiumPercent * 100) / 100,
  };
}

/**
 * Quick pricing function with sensible defaults for US equity options
 *
 * @example
 * const price = priceAmericanOption(100, 105, 0.25, 0.25, 'put');
 * // Returns price of a 3-month put with 25% vol
 */
export function priceAmericanOption(
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  volatility: number,
  optionType: 'call' | 'put',
  riskFreeRate: number = 0.05
): number {
  const result = calculateBinomialTree({
    spotPrice,
    strikePrice,
    timeToExpiry,
    volatility,
    optionType,
    riskFreeRate,
    optionStyle: 'american',
    steps: 100,
  });
  return result.price;
}

/**
 * Visualize the binomial tree (for educational/debugging purposes)
 * Returns a string representation of the first few steps
 */
export function visualizeBinomialTree(inputs: BinomialTreeInputs, maxSteps: number = 4): string {
  const { spotPrice: S, volatility: sigma, timeToExpiry: T, steps: n = 100 } = inputs;

  const stepsToShow = Math.min(maxSteps, n);
  const dt = T / n;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;

  let output = `Binomial Tree (first ${stepsToShow} steps of ${n})\n`;
  output += `u = ${u.toFixed(4)}, d = ${d.toFixed(4)}\n\n`;

  for (let i = 0; i <= stepsToShow; i++) {
    const indent = '  '.repeat(stepsToShow - i);
    const prices: string[] = [];

    for (let j = 0; j <= i; j++) {
      const price = S * Math.pow(u, j) * Math.pow(d, i - j);
      prices.push(`$${price.toFixed(2)}`);
    }

    output += `t=${i}: ${indent}${prices.join('  ')}\n`;
  }

  return output;
}
