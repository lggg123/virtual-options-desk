// lib/blog/simple-blog-agent.ts
import { getCrewAIService, MarketAnalysis } from '../analysis/crewai-service';
import { CronJob } from 'cron';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  publishedAt: Date;
  marketData?: MarketAnalysis;
  readingTime: number;
  slug: string;
  status: 'draft' | 'published';
}

export interface EODMarketData {
  symbol: string;
  timestamp: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume: number;
}

export class SimpleBlogAgent {
  private cronJob: CronJob | null = null;
  private apiKey: string | undefined;
  private isRunning: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetches real-time price data for a set of symbols from EODHD API.
   * Returns an array of { price, volume, timestamp, symbol } objects for each symbol.
   */

  async fetchEODHDMarketData(symbols: string[], timeoutMs: number = 5000): Promise<EODMarketData[]> {
    const apiKey = process.env.NEXT_PUBLIC_EODHD_API_KEY || process.env.EODHD_API_KEY;
    if (!apiKey) {
      throw new Error('EODHD API key not found in environment variables.');
    }
    const baseUrl = 'https://eodhd.com/api/real-time/';
    const marketData: EODMarketData[] = [];

    const fetchPromises = symbols.map(symbol => {
      const controller = new AbortController();
      const signal = controller.signal;
      const url = `${baseUrl}${symbol}.US?api_token=${apiKey}&fmt=json`;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { signal })
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
              symbol,
              timestamp: new Date().toISOString(),
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume || 1000
            } as EODMarketData;
          } else {
            throw new Error(`No close price for ${symbol}`);
          }
        })
        .catch(err => {
          clearTimeout(timeout);
          if (err.name === 'AbortError') {
            throw new Error(`Timeout/Abort for ${symbol}`);
          }
          throw err;
        });
    });

    const results = await Promise.allSettled(fetchPromises);
    results.forEach((result, idx) => {
      const symbol = symbols[idx];
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data && typeof data.close === 'number') {
          marketData.push(data);
        } else {
          console.error(`[EODHD] Data missing 'close' for symbol: ${symbol}`, data);
        }
      } else {
        console.error(`[EODHD] Error fetching symbol: ${symbol}`, result.reason);
      }
    });
    return marketData;
  }

  async generateDailyBlog(): Promise<BlogPost> {
    console.log('🤖 Blog Agent: Generating daily market blog...');
    
    try {
      // Define the symbols you want to analyze (could be dynamic)
      const symbols = ['AAPL', 'GOOG', 'GOOGL', 'MSFT', 'INTC'];
      // Fetch real market data
      const marketData: EODMarketData[] = await this.fetchEODHDMarketData(symbols);
      if (!marketData.length) throw new Error('No market data fetched from EODHD.');
      // Convert EODMarketData[] to MarketData[]
      const marketDataForAnalysis = marketData.map(d => ({
        price: d.close,
        volume: d.volume,
        timestamp: d.timestamp,
        high: d.high,
        low: d.low,
        open: d.open,
        symbol: d.symbol
      }));
      // Get market analysis from CrewAI
      const crewaiService = getCrewAIService({ apiKey: this.apiKey });
      const marketAnalysis = await crewaiService.analyzeMarketTrend(marketDataForAnalysis);
      
      // Generate blog content
      const blogPost = this.createBlogFromAnalysis(marketAnalysis);
      
      console.log(`✅ Generated blog: "${blogPost.title}"`);
      return blogPost;
      
    } catch (error) {
      console.error('❌ Blog generation failed:', error);
      throw error;
    }
  }

  async generateCustomBlog(topic: string): Promise<BlogPost> {
    console.log(`🤖 Blog Agent: Generating custom blog about "${topic}"...`);
    
    try {
      const blogPost = this.createCustomBlog(topic);
      console.log(`✅ Generated custom blog: "${blogPost.title}"`);
      return blogPost;
      
    } catch (error) {
      console.error('❌ Custom blog generation failed:', error);
      throw error;
    }
  }

  startDailySchedule(schedule: string = '0 9 * * 1-5'): void {
    if (this.isRunning) {
      console.log('📅 Daily blog schedule already running');
      return;
    }

    this.cronJob = new CronJob(
      schedule, // 9 AM weekdays
      async () => {
        try {
          const blogPost = await this.generateDailyBlog();
          // Here you would save to database or send to your blog platform
          this.publishBlog(blogPost);
        } catch (error) {
          console.error('❌ Scheduled blog generation failed:', error);
        }
      },
      null,
      false,
      'America/New_York'
    );

    this.cronJob.start();
    this.isRunning = true;
    
    console.log(`🚀 Daily blog schedule started: ${schedule}`);
    console.log(`📊 Next blog: ${this.cronJob.nextDate()?.toLocaleString()}`);
  }

  stopDailySchedule(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('⏹️  Daily blog schedule stopped');
  }

  private createBlogFromAnalysis(analysis: MarketAnalysis): BlogPost {
    const title = `Market Pulse ${new Date().toLocaleDateString()}: ${analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1)} Momentum Ahead`;
    
    const content = `# ${title}

## Executive Summary

${analysis.reasoning} Our analysis shows a **${analysis.trend.toUpperCase()}** trend with ${Math.round(analysis.confidence * 100)}% confidence level.

## Technical Analysis

${analysis.metrics ? `
### Current Market Metrics
- **Current Price**: $${analysis.metrics.current_price.toFixed(2)}
- **Price Change**: ${analysis.metrics.price_change_pct.toFixed(2)}% (${analysis.metrics.price_change > 0 ? '📈' : '📉'})
- **Momentum**: ${(analysis.metrics.momentum * 100).toFixed(2)}%
- **Volatility**: ${(analysis.metrics.volatility * 100).toFixed(2)}%

` : ''}${analysis.support_resistance ? `
### Key Levels to Watch
- **Support Level**: $${analysis.support_resistance.support.toFixed(2)}
- **Resistance Level**: $${analysis.support_resistance.resistance.toFixed(2)}
- **Pivot Point**: $${analysis.support_resistance.pivot.toFixed(2)}

` : ''}## Trading Strategy

Based on the ${analysis.trend} trend analysis:

${this.generateTradingStrategy(analysis)}

## Market Outlook

The ${analysis.trend} sentiment suggests ${this.generateOutlook(analysis)}

## Key Takeaways

${this.generateTakeaways(analysis)}

---
*This analysis is for educational purposes only and does not constitute financial advice. Always do your own research and consult with a financial advisor.*`;

    return {
      id: this.generateId(),
      title,
      content,
      summary: `Market analysis showing ${analysis.trend} trend with ${Math.round(analysis.confidence * 100)}% confidence. ${analysis.reasoning.substring(0, 100)}...`,
      tags: ['market-analysis', 'trading', analysis.trend, 'options', 'daily-analysis'],
      publishedAt: new Date(),
      marketData: analysis,
      readingTime: Math.ceil(content.split(' ').length / 200),
      slug: this.generateSlug(title),
      status: 'published'
    };
  }

  private createCustomBlog(topic: string): BlogPost {
    const title = `Deep Dive: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
    
    const content = `# ${title}

## Introduction

Welcome to our comprehensive analysis of ${topic}. In today's complex financial markets, understanding ${topic} is crucial for making informed investment decisions.

## Market Context

The current market environment presents unique opportunities and challenges related to ${topic}. Let's explore the key factors driving this space.

## Strategic Considerations

When approaching ${topic}, consider these essential elements:

1. **Risk Assessment**: Evaluate potential downside scenarios
2. **Opportunity Analysis**: Identify key value drivers
3. **Timing Considerations**: Market cycle positioning
4. **Portfolio Impact**: How this fits your overall strategy

## Implementation Approach

For retail and institutional investors looking to engage with ${topic}:

### Phase 1: Research & Analysis
- Conduct thorough fundamental analysis
- Review technical indicators
- Assess market sentiment

### Phase 2: Strategy Development
- Define entry and exit criteria
- Set position sizing parameters
- Establish risk management protocols

### Phase 3: Execution & Monitoring
- Execute trades with proper timing
- Monitor performance metrics
- Adjust strategy as needed

## Key Takeaways

- ${topic} requires careful analysis and strategic thinking
- Risk management should always be the top priority
- Stay informed about market developments
- Consider professional guidance for complex strategies

---
*Educational content - not financial advice. Always consult with qualified professionals.*`;

    return {
      id: this.generateId(),
      title,
      content,
      summary: `Comprehensive analysis of ${topic} including strategic considerations, implementation approaches, and key insights for informed decision-making.`,
      tags: ['analysis', topic.replace(/\s+/g, '-').toLowerCase(), 'strategy', 'education'],
      publishedAt: new Date(),
      readingTime: Math.ceil(content.split(' ').length / 200),
      slug: this.generateSlug(title),
      status: 'published'
    };
  }

  private generateTradingStrategy(analysis: MarketAnalysis): string {
    switch (analysis.trend) {
      case 'bullish':
        return `
- **Long Positions**: Consider call options or long stock positions
- **Defensive Strategies**: Protective puts for downside protection
- **Volatility Plays**: If volatility is low, consider straddles for breakout moves
- **Risk Management**: Set stop-losses at key support levels`;

      case 'bearish':
        return `
- **Short Strategies**: Put options or covered calls on existing positions
- **Hedging**: Protect long portfolios with puts or collar strategies
- **Cash Management**: Consider reducing exposure or raising cash levels
- **Risk Management**: Avoid catching falling knives, wait for confirmation`;

      case 'sideways':
        return `
- **Range Trading**: Buy at support, sell at resistance
- **Options Income**: Iron condors, strangles for premium collection
- **Patience**: Wait for clearer directional signals
- **Risk Management**: Keep position sizes smaller in uncertain markets`;

      default:
        return `
- **Cautious Approach**: Wait for clearer market signals
- **Risk Management**: Focus on capital preservation
- **Diversification**: Maintain balanced portfolio exposure`;
    }
  }

  private generateOutlook(analysis: MarketAnalysis): string {
    const confidence = Math.round(analysis.confidence * 100);
    
    if (confidence > 75) {
      return `strong conviction in the current directional move. Monitor for continuation patterns.`;
    } else if (confidence > 50) {
      return `moderate confidence levels. Stay alert for potential reversals or consolidation.`;
    } else {
      return `uncertainty in market direction. Focus on risk management and await clearer signals.`;
    }
  }

  private generateTakeaways(analysis: MarketAnalysis): string {
    return `
1. **Market Trend**: ${analysis.trend.toUpperCase()} with ${Math.round(analysis.confidence * 100)}% confidence
2. **Strategy Focus**: ${analysis.trend === 'bullish' ? 'Long bias with protective measures' : analysis.trend === 'bearish' ? 'Defensive positioning and hedging' : 'Range-bound strategies and patience'}
3. **Risk Management**: Always prioritize capital preservation
4. **Opportunity**: ${analysis.trend !== 'sideways' ? 'Directional momentum plays' : 'Premium collection strategies'}
5. **Monitoring**: Watch key support/resistance levels for confirmation`;
  }

  private async publishBlog(blogPost: BlogPost): Promise<void> {
    // Here you would integrate with your blog platform or database
    console.log(`📢 Publishing blog: "${blogPost.title}"`);
    console.log(`📝 Summary: ${blogPost.summary}`);
    console.log(`🏷️  Tags: ${blogPost.tags.join(', ')}`);
    console.log(`⏱️  Reading time: ${blogPost.readingTime} minutes`);
    
    // Save to database or send to blog platform
    // Example integrations:
    // - Save to Supabase
    // - Post to WordPress API
    // - Send to Notion
    // - Publish to Medium
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob?.nextDate()?.toLocaleString() || null,
      hasApiKey: !!this.apiKey
    };
  }
}

// Global instance
let blogAgent: SimpleBlogAgent | null = null;

export function getBlogAgent(apiKey?: string): SimpleBlogAgent {
  if (!blogAgent) {
    blogAgent = new SimpleBlogAgent(apiKey);
  }
  return blogAgent;
}