// lib/analysis/crewai-service.ts
import { MarketData, OptionsPricing } from '../types';
import { spawn } from 'child_process';
import path from 'path';

export interface MarketAnalysis {
  trend: 'bullish' | 'bearish' | 'sideways';
  confidence: number;
  splineData?: {
    x: number[];
    
    y: number[];
    z: number[];
  };
  reasoning: string;
  timeHorizon: string;
  metrics?: {
    momentum: number;
    volatility: number;
    current_price: number;
    price_change: number;
    price_change_pct: number;
  };
  support_resistance?: {
    support: number;
    resistance: number;
    pivot: number;
  };
  error?: boolean;
  message?: string;
}

export interface CrewAIConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  pythonPath?: string;
}

export class CrewAIAnalysisService {
  private config: CrewAIConfig;
  private initialized: boolean = false;
  private pythonScriptPath: string;

  constructor(config: CrewAIConfig = {}) {
    this.config = {
      model: 'gpt-4',
      temperature: 0.1,
      pythonPath: 'python3',
      ...config
    };
    
    // Set Python script path
    this.pythonScriptPath = path.join(process.cwd(), 'python', 'crewai_analysis.py');
  }

  async initialize(): Promise<void> {
    try {
      // Test Python environment
      await this.testPythonEnvironment();
      this.initialized = true;
      console.log('🤖 CrewAI Analysis Service initialized with Python backend');
    } catch (error) {
      console.error('❌ Failed to initialize CrewAI service:', error);
      throw error;
    }
  }

  private async testPythonEnvironment(): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.config.pythonPath || 'python3', [this.pythonScriptPath, '{"test": true}']);
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python environment test failed with code ${code}`));
        }
      });
      
      python.on('error', (err) => {
        reject(new Error(`Python environment test failed: ${err.message}`));
      });
    });
  }

  async analyzeMarketTrend(
    marketData: MarketData[],
    timeHorizon: '1D' | '1W' | '1M' | '3M' = '1D'
  ): Promise<MarketAnalysis> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Prepare data for Python analysis
      const inputData = {
        marketData: marketData.map(d => ({
          price: d.price,
          volume: d.volume || 1000,
          timestamp: d.timestamp
        })),
        apiKey: this.config.apiKey,
        timeHorizon
      };

      // Call Python CrewAI analysis
      const result = await this.callPythonAnalysis(inputData);
      
      console.log(`📊 Market Analysis Complete: ${result.trend.toUpperCase()} (${Math.round(result.confidence * 100)}% confidence)`);
      
      return result;
    } catch (error) {
      console.error('❌ Market analysis failed:', error);
      
      // Fallback to basic analysis
      return this.fallbackAnalysis(marketData, timeHorizon);
    }
  }

  private async callPythonAnalysis(inputData: Record<string, unknown>): Promise<MarketAnalysis> {
    return new Promise((resolve, reject) => {
      let resultData = '';
      let errorData = '';
      
      const python = spawn(this.config.pythonPath || 'python3', [
        this.pythonScriptPath,
        JSON.stringify(inputData)
      ]);

      python.stdout.on('data', (data) => {
        resultData += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(resultData);
            if (result.error) {
              reject(new Error(result.message || 'Python analysis returned error'));
              return;
            }
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python analysis result: ${parseError}`));
          }
        } else {
          reject(new Error(`Python analysis failed with code ${code}: ${errorData}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Python process failed: ${err.message}`));
      });
    });
  }

  private fallbackAnalysis(marketData: MarketData[], timeHorizon: string): MarketAnalysis {
    const prices = marketData.map(d => d.price);
    const volumes = marketData.map(d => d.volume || 1000);
    const timestamps = marketData.map(d => new Date(d.timestamp).getTime());

    const splineData = this.generate3DSplineData(prices, volumes, timestamps);
    const trendAnalysis = this.calculateTrendMetrics(prices);
    
    return {
      trend: this.determineTrend(trendAnalysis),
      confidence: this.calculateConfidence(trendAnalysis, volumes),
      splineData,
      reasoning: this.generateReasoningText(trendAnalysis, timeHorizon),
      timeHorizon,
      error: true,
      message: 'Using fallback analysis - Python service unavailable'
    };
  }

  async analyzeOptionsStrategy(): Promise<{
    strategy: string;
    reasoning: string;
    confidence: number;
    expectedReturn: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Analyze implied volatility and Greeks (placeholder)
    this.analyzeImpliedVolatility();
    this.analyzeGreeks();

    return {
      strategy: 'iron_condor', // Example strategy
      reasoning: 'Low volatility environment suggests range-bound movement',
      confidence: 0.75,
      expectedReturn: 0.08,
      riskLevel: 'medium'
    };
  }

  private generate3DSplineData(
    prices: number[],
    volumes: number[],
    timestamps: number[]
  ): { x: number[]; y: number[]; z: number[] } {
    // Generate cubic spline interpolation points for 3D visualization
    const x = timestamps.map((t, i) => i); // Time axis
    const y = prices; // Price axis
    const z = volumes; // Volume axis

    return { x, y, z };
  }

  private calculateTrendMetrics(prices: number[]): {
    momentum: number;
    volatility: number;
    direction: number;
    strength: number;
  } {
    if (prices.length < 2) {
      return { momentum: 0, volatility: 0, direction: 0, strength: 0 };
    }

    // Calculate simple momentum (rate of change)
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const momentum = (lastPrice - firstPrice) / firstPrice;

    // Calculate volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Calculate directional strength
    const upMoves = returns.filter(r => r > 0).length;
    const direction = (upMoves / returns.length) - 0.5; // -0.5 to 0.5 range
    const strength = Math.abs(direction) * 2; // 0 to 1 range

    return { momentum, volatility, direction, strength };
  }

  private determineTrend(metrics: {
    momentum: number;
    volatility: number;
    direction: number;
    strength: number;
  }): 'bullish' | 'bearish' | 'sideways' {
    const { momentum, direction, strength } = metrics;

    // Strong directional movement
    if (strength > 0.6) {
      return direction > 0 ? 'bullish' : 'bearish';
    }

    // Momentum-based analysis
    if (Math.abs(momentum) < 0.02) {
      return 'sideways';
    }

    return momentum > 0 ? 'bullish' : 'bearish';
  }

  private calculateConfidence(
    metrics: { volatility: number; strength: number },
    volumes: number[]
  ): number {
    const { volatility, strength } = metrics;
    
    // Higher confidence with lower volatility and higher strength
    const volatilityScore = Math.max(0, 1 - (volatility * 10));
    const strengthScore = strength;
    
    // Volume consistency (higher confidence with consistent volume)
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeVariance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
    const volumeScore = Math.max(0, 1 - (Math.sqrt(volumeVariance) / avgVolume));

    return (volatilityScore * 0.4 + strengthScore * 0.4 + volumeScore * 0.2);
  }

  private generateReasoningText(
    metrics: { momentum: number; volatility: number; direction: number; strength: number },
    timeHorizon: string
  ): string {
    const { momentum, volatility, direction, strength } = metrics;
    
    let reasoning = `Analysis over ${timeHorizon} timeframe shows `;
    
    if (strength > 0.6) {
      reasoning += direction > 0 ? 'strong bullish momentum' : 'strong bearish pressure';
    } else if (Math.abs(momentum) < 0.02) {
      reasoning += 'sideways consolidation with limited directional bias';
    } else {
      reasoning += momentum > 0 ? 'mild bullish tendency' : 'mild bearish tendency';
    }

    if (volatility > 0.03) {
      reasoning += ' with elevated volatility suggesting uncertainty';
    } else {
      reasoning += ' with low volatility indicating stable conditions';
    }

    return reasoning + '.';
  }

  private analyzeImpliedVolatility(): {
    average: number;
    skew: number;
    term_structure: number[];
  } {
    // Placeholder implementation
    return {
      average: 0.25,
      skew: 0.02,
      term_structure: [0.2, 0.22, 0.25, 0.27]
    };
  }

  private analyzeGreeks(): {
    total_delta: number;
    total_gamma: number;
    total_theta: number;
    total_vega: number;
  } {
    // Placeholder implementation
    return {
      total_delta: 0,
      total_gamma: 0,
      total_theta: 0,
      total_vega: 0
    };
  }
}

// Global service instance
let crewaiService: CrewAIAnalysisService | null = null;

export function getCrewAIService(config?: CrewAIConfig): CrewAIAnalysisService {
  if (!crewaiService) {
    crewaiService = new CrewAIAnalysisService(config);
  }
  return crewaiService;
}