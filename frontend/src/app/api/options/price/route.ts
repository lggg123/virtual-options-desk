// app/api/options/price/route.ts
import { NextResponse } from 'next/server';
import { calculateBlackScholes } from '@/lib/calculations/black-scholes';
import { calculateBinomialTree, compareAmericanVsEuropean } from '@/lib/calculations/binomial-tree';

/**
 * Options Pricing API
 *
 * Supports both American (binomial tree) and European (Black-Scholes) options.
 * Default is American since most US equity options are American-style.
 *
 * POST /api/options/price
 *
 * Body:
 * - spotPrice: number (current stock price)
 * - strikePrice: number (option strike price)
 * - timeToExpiry: number (years to expiration)
 * - riskFreeRate: number (annual rate, e.g., 0.05 for 5%)
 * - volatility: number (annual volatility, e.g., 0.25 for 25%)
 * - optionType: 'call' | 'put'
 * - optionStyle?: 'american' | 'european' (default: 'american')
 * - steps?: number (binomial tree steps, default: 100)
 * - model?: 'binomial' | 'black-scholes' (default: 'binomial' for American, 'black-scholes' for European)
 * - compare?: boolean (if true, returns both American and European prices)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required inputs
    const requiredFields = ['spotPrice', 'strikePrice', 'timeToExpiry', 'riskFreeRate', 'volatility', 'optionType'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const {
      optionStyle = 'american',
      model,
      compare = false,
      steps = 100,
      ...pricingInputs
    } = body;

    // If comparison requested, return both American and European prices
    if (compare) {
      const comparison = compareAmericanVsEuropean({
        ...pricingInputs,
        steps,
      });

      return NextResponse.json({
        ...comparison,
        model: 'binomial',
        note: 'Comparison shows the value of early exercise (American premium)',
      });
    }

    // Determine which model to use
    // - American options: always use binomial tree (Black-Scholes can't handle early exercise)
    // - European options: use Black-Scholes (faster, closed-form) unless binomial requested
    const useBlackScholes = optionStyle === 'european' && model !== 'binomial';

    if (useBlackScholes) {
      // European option with Black-Scholes (faster)
      const pricing = calculateBlackScholes(pricingInputs);

      return NextResponse.json({
        ...pricing,
        optionStyle: 'european',
        model: 'black-scholes',
      });
    } else {
      // American option (or European with binomial tree)
      const pricing = calculateBinomialTree({
        ...pricingInputs,
        optionStyle,
        steps,
      });

      return NextResponse.json({
        ...pricing,
        model: 'binomial',
      });
    }
  } catch (error) {
    console.error('Error calculating option price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate option price' },
      { status: 500 }
    );
  }
}