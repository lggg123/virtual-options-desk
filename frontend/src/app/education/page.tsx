'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Shield,
  Target,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  GraduationCap
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

interface StrategyCardProps {
  title: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
  outlook: string;
  legs: string[];
  example: {
    setup: string;
    result: string;
  };
  icon: React.ReactNode;
}

function StrategyCard({
  title,
  description,
  riskLevel,
  maxProfit,
  maxLoss,
  breakeven,
  outlook,
  legs,
  example,
  icon
}: StrategyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const riskColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={riskColors[riskLevel]}>{riskLevel} Risk</Badge>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">Max Profit:</span>
                <span>{maxProfit}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="font-medium">Max Loss:</span>
                <span>{maxLoss}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Breakeven:</span>
                <span>{breakeven}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Outlook:</span>
                <span>{outlook}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Strategy Legs:</h4>
            <ul className="space-y-1">
              {legs.map((leg, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {leg}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Example:</h4>
            <p className="text-sm text-muted-foreground">{example.setup}</p>
            <p className="text-sm mt-2"><strong>Result:</strong> {example.result}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function EducationPage() {
  const basicStrategies: StrategyCardProps[] = [
    {
      title: 'Long Call',
      description: 'Buy a call option to profit from rising stock prices with limited risk.',
      riskLevel: 'Medium',
      maxProfit: 'Unlimited',
      maxLoss: 'Premium paid',
      breakeven: 'Strike price + Premium',
      outlook: 'Bullish',
      legs: ['Buy 1 Call Option'],
      example: {
        setup: 'Buy AAPL $180 Call for $5.00 premium when stock is at $175',
        result: 'If AAPL rises to $200, call is worth $20. Profit = $20 - $5 = $15 per share ($1,500 per contract)'
      },
      icon: <TrendingUp className="h-5 w-5 text-green-600" />
    },
    {
      title: 'Long Put',
      description: 'Buy a put option to profit from falling stock prices or hedge existing positions.',
      riskLevel: 'Medium',
      maxProfit: 'Strike price - Premium (stock goes to $0)',
      maxLoss: 'Premium paid',
      breakeven: 'Strike price - Premium',
      outlook: 'Bearish',
      legs: ['Buy 1 Put Option'],
      example: {
        setup: 'Buy AAPL $180 Put for $5.00 premium when stock is at $185',
        result: 'If AAPL falls to $160, put is worth $20. Profit = $20 - $5 = $15 per share ($1,500 per contract)'
      },
      icon: <TrendingDown className="h-5 w-5 text-red-600" />
    },
    {
      title: 'Covered Call',
      description: 'Sell a call against shares you own to generate income from premiums.',
      riskLevel: 'Low',
      maxProfit: 'Premium + (Strike - Stock Price)',
      maxLoss: 'Stock price - Premium (if stock goes to $0)',
      breakeven: 'Stock purchase price - Premium',
      outlook: 'Neutral to Slightly Bullish',
      legs: ['Own 100 shares of stock', 'Sell 1 Call Option'],
      example: {
        setup: 'Own 100 AAPL shares at $175, sell $180 Call for $3.00 premium',
        result: 'If AAPL stays below $180, keep $300 premium. If called away at $180, profit = $500 + $300 = $800'
      },
      icon: <Shield className="h-5 w-5 text-blue-600" />
    },
    {
      title: 'Cash-Secured Put',
      description: 'Sell a put while holding cash to buy shares if assigned, generating income.',
      riskLevel: 'Low',
      maxProfit: 'Premium received',
      maxLoss: 'Strike price - Premium (if stock goes to $0)',
      breakeven: 'Strike price - Premium',
      outlook: 'Neutral to Bullish',
      legs: ['Hold cash equal to strike x 100', 'Sell 1 Put Option'],
      example: {
        setup: 'Hold $17,500 cash, sell AAPL $175 Put for $4.00 premium',
        result: 'If AAPL stays above $175, keep $400 premium. If assigned, own shares at effective price of $171'
      },
      icon: <DollarSign className="h-5 w-5 text-green-600" />
    }
  ];

  const spreadStrategies: StrategyCardProps[] = [
    {
      title: 'Bull Call Spread',
      description: 'A vertical spread using calls to profit from moderate upward moves with limited risk.',
      riskLevel: 'Low',
      maxProfit: 'Difference in strikes - Net debit',
      maxLoss: 'Net debit paid',
      breakeven: 'Lower strike + Net debit',
      outlook: 'Moderately Bullish',
      legs: ['Buy 1 Call at lower strike', 'Sell 1 Call at higher strike'],
      example: {
        setup: 'Buy AAPL $175 Call for $8, Sell AAPL $185 Call for $4. Net debit = $4',
        result: 'Max profit if AAPL above $185 = $10 - $4 = $6 ($600). Max loss if below $175 = $4 ($400)'
      },
      icon: <TrendingUp className="h-5 w-5 text-green-600" />
    },
    {
      title: 'Bear Put Spread',
      description: 'A vertical spread using puts to profit from moderate downward moves with limited risk.',
      riskLevel: 'Low',
      maxProfit: 'Difference in strikes - Net debit',
      maxLoss: 'Net debit paid',
      breakeven: 'Higher strike - Net debit',
      outlook: 'Moderately Bearish',
      legs: ['Buy 1 Put at higher strike', 'Sell 1 Put at lower strike'],
      example: {
        setup: 'Buy AAPL $185 Put for $8, Sell AAPL $175 Put for $4. Net debit = $4',
        result: 'Max profit if AAPL below $175 = $10 - $4 = $6 ($600). Max loss if above $185 = $4 ($400)'
      },
      icon: <TrendingDown className="h-5 w-5 text-red-600" />
    },
    {
      title: 'Iron Condor',
      description: 'Sell both a put spread and call spread to profit from low volatility.',
      riskLevel: 'Medium',
      maxProfit: 'Net credit received',
      maxLoss: 'Width of wider spread - Net credit',
      breakeven: 'Two breakevens at short strikes +/- credit',
      outlook: 'Neutral (Range-bound)',
      legs: [
        'Sell 1 OTM Put',
        'Buy 1 further OTM Put',
        'Sell 1 OTM Call',
        'Buy 1 further OTM Call'
      ],
      example: {
        setup: 'AAPL at $180: Sell $170/$165 Put spread and $190/$195 Call spread for $2.00 total credit',
        result: 'Max profit if AAPL between $170-$190 = $200. Max loss if outside $165 or $195 = $300'
      },
      icon: <ArrowUpDown className="h-5 w-5 text-purple-600" />
    },
    {
      title: 'Iron Butterfly',
      description: 'Similar to iron condor but with short strikes at the same price for higher premium.',
      riskLevel: 'Medium',
      maxProfit: 'Net credit received',
      maxLoss: 'Width of spread - Net credit',
      breakeven: 'Short strike +/- Credit received',
      outlook: 'Very Neutral (Expecting no movement)',
      legs: [
        'Sell 1 ATM Put',
        'Buy 1 OTM Put',
        'Sell 1 ATM Call',
        'Buy 1 OTM Call'
      ],
      example: {
        setup: 'AAPL at $180: Sell $180 Put and Call, Buy $170 Put and $190 Call for $4.50 credit',
        result: 'Max profit if AAPL exactly at $180 = $450. Breakevens at $175.50 and $184.50'
      },
      icon: <Target className="h-5 w-5 text-orange-600" />
    },
    {
      title: 'Calendar Spread',
      description: 'Buy a longer-dated option and sell a shorter-dated option at the same strike.',
      riskLevel: 'Medium',
      maxProfit: 'Varies based on time decay difference',
      maxLoss: 'Net debit paid',
      breakeven: 'Complex - depends on implied volatility',
      outlook: 'Neutral near-term, directional long-term',
      legs: [
        'Buy 1 longer-dated option',
        'Sell 1 shorter-dated option at same strike'
      ],
      example: {
        setup: 'Buy AAPL Jan $180 Call for $12, Sell AAPL Dec $180 Call for $8. Net debit = $4',
        result: 'Profit if stock near $180 at Dec expiration as near-term option decays faster'
      },
      icon: <BarChart3 className="h-5 w-5 text-blue-600" />
    }
  ];

  const advancedStrategies: StrategyCardProps[] = [
    {
      title: 'Straddle',
      description: 'Buy both a call and put at the same strike to profit from large moves in either direction.',
      riskLevel: 'High',
      maxProfit: 'Unlimited (on upside)',
      maxLoss: 'Total premium paid',
      breakeven: 'Strike +/- Total premium',
      outlook: 'High Volatility Expected',
      legs: ['Buy 1 ATM Call', 'Buy 1 ATM Put'],
      example: {
        setup: 'Buy AAPL $180 Call for $6 and $180 Put for $5.50. Total cost = $11.50',
        result: 'Profit if AAPL moves above $191.50 or below $168.50. Max loss if at $180 = $1,150'
      },
      icon: <ArrowUpDown className="h-5 w-5 text-red-600" />
    },
    {
      title: 'Strangle',
      description: 'Buy OTM call and put to profit from large moves, cheaper than straddle.',
      riskLevel: 'High',
      maxProfit: 'Unlimited (on upside)',
      maxLoss: 'Total premium paid',
      breakeven: 'Two breakevens at strikes +/- premium',
      outlook: 'High Volatility Expected',
      legs: ['Buy 1 OTM Call', 'Buy 1 OTM Put'],
      example: {
        setup: 'Buy AAPL $190 Call for $3 and $170 Put for $2.50. Total cost = $5.50',
        result: 'Profit if AAPL above $195.50 or below $164.50. Max loss if between $170-$190 = $550'
      },
      icon: <ArrowUpDown className="h-5 w-5 text-orange-600" />
    },
    {
      title: 'Ratio Spread',
      description: 'Buy options at one strike and sell more options at another strike.',
      riskLevel: 'High',
      maxProfit: 'Limited or credit received',
      maxLoss: 'Unlimited on one side',
      breakeven: 'Complex - varies by ratio',
      outlook: 'Directional with specific target',
      legs: [
        'Buy X options at one strike',
        'Sell Y options at different strike (where Y > X)'
      ],
      example: {
        setup: 'Buy 1 AAPL $175 Call for $8, Sell 2 AAPL $185 Calls for $4 each. Net credit = $0',
        result: 'Max profit at $185 = $1,000. Unlimited risk above $195 due to naked short call'
      },
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />
    },
    {
      title: 'Jade Lizard',
      description: 'Sell a put and a call spread for premium with no upside risk.',
      riskLevel: 'Medium',
      maxProfit: 'Net credit received',
      maxLoss: 'Put strike - Credit (if stock goes to $0)',
      breakeven: 'Put strike - Credit',
      outlook: 'Neutral to Bullish',
      legs: [
        'Sell 1 OTM Put',
        'Sell 1 OTM Call',
        'Buy 1 further OTM Call'
      ],
      example: {
        setup: 'Sell AAPL $170 Put for $3, Sell $190 Call for $2.50, Buy $195 Call for $1.50. Credit = $4',
        result: 'No loss if AAPL above $190 (call spread max $5, but received $4 credit). Risk below $166'
      },
      icon: <Shield className="h-5 w-5 text-green-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">Options Education Center</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Learn about different options strategies, from basic calls and puts to advanced multi-leg spreads.
            Understanding these strategies is essential for successful options trading.
          </p>
        </div>

        {/* Navigation Tabs for Education Section */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-muted/50">
            <Link href="/education/fundamentals">
              <Button variant="ghost" size="sm" className="rounded-md">
                <GraduationCap className="h-4 w-4 mr-2" />
                Fundamentals
              </Button>
            </Link>
            <Link href="/education">
              <Button variant="secondary" size="sm" className="rounded-md">
                <BookOpen className="h-4 w-4 mr-2" />
                Strategies
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">4</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Basic Strategies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">5</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Spread Strategies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">4</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Advanced Strategies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">$2M</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Practice Capital</p>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Tabs */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="basic" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Basic </span>Strategies
            </TabsTrigger>
            <TabsTrigger value="spreads" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Spread </span>Strategies
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm py-2">
              Advanced<span className="hidden sm:inline"> Strategies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
              <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Beginner Friendly
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                These strategies are perfect for those new to options trading. They have straightforward mechanics and defined risk profiles.
              </p>
            </div>
            <div className="grid gap-4">
              {basicStrategies.map((strategy, index) => (
                <StrategyCard key={index} {...strategy} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="spreads" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Intermediate Level
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Spread strategies involve multiple options legs to create defined-risk positions. They&apos;re more capital efficient than single-leg strategies.
              </p>
            </div>
            <div className="grid gap-4">
              {spreadStrategies.map((strategy, index) => (
                <StrategyCard key={index} {...strategy} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
              <h3 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Advanced - Higher Risk
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                These strategies require a solid understanding of options mechanics and may involve unlimited risk. Practice thoroughly before using real capital.
              </p>
            </div>
            <div className="grid gap-4">
              {advancedStrategies.map((strategy, index) => (
                <StrategyCard key={index} {...strategy} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Greeks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Understanding the Greeks
            </CardTitle>
            <CardDescription>
              The Greeks measure different dimensions of risk in options positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-green-600">Delta (Δ)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Measures how much option price changes per $1 move in stock. Range: -1 to +1
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-blue-600">Gamma (Γ)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Rate of change in Delta. Higher near ATM options and expiration.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-red-600">Theta (Θ)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Time decay - how much value option loses per day. Accelerates near expiration.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-purple-600">Vega (ν)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Sensitivity to implied volatility changes. Higher for ATM and longer-dated options.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to Practice?</h3>
            <p className="mb-4 opacity-90 text-sm sm:text-base">
              Apply what you&apos;ve learned with $2,000,000 in virtual capital. No risk, just learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/trading">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Start Trading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 hover:bg-white/20">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
