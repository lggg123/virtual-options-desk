'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Scale,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Calculator,
  ChevronDown,
  ChevronUp,
  PlayCircle
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

interface ConceptCardProps {
  title: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  color: string;
}

function ConceptCard({ title, description, details, icon, color }: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${color} rounded-lg`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <ul className="space-y-2">
            {details.map((detail, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FundamentalsPage() {
  const whatIsOption = [
    {
      title: 'What is an Option?',
      description: 'A contract that gives you the right (not obligation) to buy or sell a stock at a specific price.',
      details: [
        'An option is a financial contract between two parties',
        'The buyer pays a "premium" to the seller for this right',
        'Each option contract represents 100 shares of stock',
        'Options have an expiration date after which they become worthless',
        'Unlike stocks, options are "derivatives" - their value is derived from an underlying asset'
      ],
      icon: <HelpCircle className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-100 dark:bg-blue-950'
    },
    {
      title: 'Call Options',
      description: 'The right to BUY a stock at the strike price before expiration.',
      details: [
        'Call buyers profit when the stock price RISES above the strike price',
        'Maximum loss for buyers is limited to the premium paid',
        'Call sellers receive premium but must sell shares if assigned',
        'Calls are often used for bullish bets or income generation',
        'Example: Buy AAPL $150 Call for $5 - you can buy AAPL at $150 regardless of market price'
      ],
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      color: 'bg-green-100 dark:bg-green-950'
    },
    {
      title: 'Put Options',
      description: 'The right to SELL a stock at the strike price before expiration.',
      details: [
        'Put buyers profit when the stock price FALLS below the strike price',
        'Maximum loss for buyers is limited to the premium paid',
        'Puts are often used for bearish bets or portfolio protection (hedging)',
        'Put sellers receive premium but must buy shares if assigned',
        'Example: Buy AAPL $150 Put for $5 - you can sell AAPL at $150 regardless of market price'
      ],
      icon: <TrendingDown className="h-5 w-5 text-red-600" />,
      color: 'bg-red-100 dark:bg-red-950'
    }
  ];

  const keyTerms = [
    {
      term: 'Strike Price',
      definition: 'The price at which you can buy (call) or sell (put) the underlying stock',
      example: 'A $150 strike call lets you buy shares at $150'
    },
    {
      term: 'Premium',
      definition: 'The price you pay to buy an option contract',
      example: 'A $3.00 premium costs $300 per contract (100 shares x $3.00)'
    },
    {
      term: 'Expiration Date',
      definition: 'The last day the option can be exercised',
      example: 'Options expire on the third Friday of the expiration month'
    },
    {
      term: 'In The Money (ITM)',
      definition: 'Option has intrinsic value - calls: stock > strike, puts: stock < strike',
      example: 'Stock at $155, $150 call is ITM by $5'
    },
    {
      term: 'At The Money (ATM)',
      definition: 'Strike price equals (or is very close to) the current stock price',
      example: 'Stock at $150, $150 strike is ATM'
    },
    {
      term: 'Out of The Money (OTM)',
      definition: 'Option has no intrinsic value - calls: stock < strike, puts: stock > strike',
      example: 'Stock at $145, $150 call is OTM by $5'
    },
    {
      term: 'Intrinsic Value',
      definition: 'The real value if exercised now - only ITM options have this',
      example: 'Stock at $160, $150 call has $10 intrinsic value'
    },
    {
      term: 'Extrinsic Value (Time Value)',
      definition: 'The additional value beyond intrinsic - based on time, volatility, etc.',
      example: 'Option worth $12 with $10 intrinsic has $2 extrinsic value'
    },
    {
      term: 'Exercise',
      definition: 'Using your right to buy (call) or sell (put) at the strike price',
      example: 'Exercising a $150 call means buying 100 shares at $150'
    },
    {
      term: 'Assignment',
      definition: 'When an option seller must fulfill their obligation',
      example: 'If your sold call is assigned, you must sell 100 shares at the strike'
    }
  ];

  const faqs: FAQItemProps[] = [
    {
      question: 'How much money do I need to start trading options?',
      answer: 'You can start with as little as a few hundred dollars for buying options, as you only pay the premium. However, selling options or trading spreads may require more capital and higher account approvals. Our virtual trading platform lets you practice with $2M in virtual capital risk-free!'
    },
    {
      question: 'Can I lose more than I invest?',
      answer: 'If you only BUY options (calls or puts), your maximum loss is limited to the premium paid. However, SELLING naked options can result in unlimited losses. This is why beginners should start with buying options or defined-risk strategies like spreads.'
    },
    {
      question: 'What happens if I hold an option until expiration?',
      answer: 'If the option is ITM (in the money), it will typically be automatically exercised. If OTM (out of the money), it expires worthless. Many traders close positions before expiration to lock in profits or avoid assignment.'
    },
    {
      question: 'Should I exercise my option or sell it?',
      answer: 'In most cases, selling the option is more profitable than exercising because you capture both intrinsic and remaining time value. Exercising only makes sense close to expiration or if you actually want to own/sell the underlying shares.'
    },
    {
      question: 'What are the Greeks and do I need to understand them?',
      answer: 'The Greeks (Delta, Gamma, Theta, Vega) measure different aspects of option risk. While not essential for beginners, understanding Delta (price sensitivity) and Theta (time decay) can significantly improve your trading decisions. We cover these in detail on our strategies page.'
    },
    {
      question: 'Why do options prices change even when the stock doesn\'t move?',
      answer: 'Options have "time value" that decreases as expiration approaches (Theta decay). They\'re also affected by implied volatility - if market uncertainty increases, options become more expensive even without stock movement.'
    },
    {
      question: 'What\'s the difference between American and European options?',
      answer: 'American-style options can be exercised any time before expiration, while European-style can only be exercised at expiration. Most stock options in the US are American-style, while index options are often European-style.'
    },
    {
      question: 'How do I know which strike price and expiration to choose?',
      answer: 'This depends on your outlook and risk tolerance. ATM options offer balanced risk/reward, OTM options are cheaper but need bigger moves, and ITM options are safer but more expensive. Longer expirations give more time but cost more in premium.'
    }
  ];

  const prosAndCons = {
    pros: [
      { title: 'Leverage', description: 'Control 100 shares for a fraction of the cost of buying stock' },
      { title: 'Limited Risk (Buying)', description: 'Maximum loss is the premium paid when buying options' },
      { title: 'Flexibility', description: 'Profit from any market direction - up, down, or sideways' },
      { title: 'Hedging', description: 'Protect existing stock positions from losses' },
      { title: 'Income Generation', description: 'Sell options to collect premium income' },
      { title: 'Capital Efficiency', description: 'Achieve similar exposure with less capital tied up' }
    ],
    cons: [
      { title: 'Time Decay', description: 'Options lose value as expiration approaches' },
      { title: 'Complexity', description: 'More variables to consider than stock trading' },
      { title: 'Total Loss Risk', description: 'Options can expire worthless, losing 100% of investment' },
      { title: 'Bid-Ask Spreads', description: 'Less liquid options can have wide spreads eating into profits' },
      { title: 'Learning Curve', description: 'Takes time to understand Greeks, strategies, and risks' },
      { title: 'Unlimited Risk (Selling)', description: 'Selling naked options can lead to significant losses' }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">Options Trading Fundamentals</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            New to options? Start here! This guide covers everything you need to know before placing your first trade.
            No prior experience required.
          </p>
        </div>

        {/* Navigation Tabs for Education Section */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-muted/50">
            <Link href="/education/fundamentals">
              <Button variant="secondary" size="sm" className="rounded-md">
                <GraduationCap className="h-4 w-4 mr-2" />
                Fundamentals
              </Button>
            </Link>
            <Link href="/education">
              <Button variant="ghost" size="sm" className="rounded-md">
                <BookOpen className="h-4 w-4 mr-2" />
                Strategies
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                  <PlayCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium">Beginner&apos;s Learning Path</p>
                  <p className="text-sm text-muted-foreground">Fundamentals → Strategies → Practice Trading</p>
                </div>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                Step 1 of 3
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="basics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="basics" className="text-xs sm:text-sm py-2">
              The Basics
            </TabsTrigger>
            <TabsTrigger value="terminology" className="text-xs sm:text-sm py-2">
              Key Terms
            </TabsTrigger>
            <TabsTrigger value="proscons" className="text-xs sm:text-sm py-2">
              Pros & Cons
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm py-2">
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* The Basics Tab */}
          <TabsContent value="basics" className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Start Here
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Understanding the basics is crucial before you start trading. Take your time with each concept -
                clicking on each card will reveal more details and examples.
              </p>
            </div>

            <div className="grid gap-4">
              {whatIsOption.map((concept, index) => (
                <ConceptCard key={index} {...concept} />
              ))}
            </div>

            {/* Visual Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Calls vs Puts: Quick Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5" />
                      CALL Options
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Right to <strong>BUY</strong> at strike price
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Profit when stock goes <strong>UP</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        <strong>Bullish</strong> outlook
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        ITM when stock &gt; strike
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
                      <TrendingDown className="h-5 w-5" />
                      PUT Options
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Right to <strong>SELL</strong> at strike price
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Profit when stock goes <strong>DOWN</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        <strong>Bearish</strong> outlook
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        ITM when stock &lt; strike
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Trade Walkthrough */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Example: Your First Call Option Trade
                </CardTitle>
                <CardDescription>
                  Let&apos;s walk through a simple call option trade step by step
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Setup: AAPL is trading at $175</p>
                      <p className="text-sm text-muted-foreground">You believe Apple will rise in the next month.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Buy: 1 AAPL $180 Call expiring in 30 days for $3.00 premium</p>
                      <p className="text-sm text-muted-foreground">Your cost: $300 (1 contract × 100 shares × $3.00)</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-green-600 dark:text-green-400">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400">Scenario A: AAPL rises to $195</p>
                      <p className="text-sm text-muted-foreground">
                        Your call is now worth at least $15 ($195 - $180 strike).
                        Profit: ($15 - $3) × 100 = <strong className="text-green-600">$1,200 (400% return!)</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-600 dark:text-yellow-400">Scenario B: AAPL stays at $175</p>
                      <p className="text-sm text-muted-foreground">
                        Your call expires worthless (OTM). Loss: <strong className="text-red-600">-$300 (100% of premium)</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg mt-4">
                  <p className="text-sm">
                    <strong>Key Insight:</strong> Notice the asymmetric risk/reward - you can make 400%+ but only lose 100% of the premium.
                    However, options expire, so you need to be right about both <em>direction</em> AND <em>timing</em>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terminology Tab */}
          <TabsContent value="terminology" className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Essential Vocabulary
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Understanding these terms is essential for reading options quotes and following trading discussions.
              </p>
            </div>

            <div className="grid gap-3">
              {keyTerms.map((item, index) => (
                <Card key={index}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <Badge variant="outline" className="w-fit font-semibold">
                        {item.term}
                      </Badge>
                      <p className="text-sm flex-1">{item.definition}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 pl-0 sm:pl-4">
                      <span className="font-medium">Example:</span> {item.example}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Option Chain Reading Guide */}
            <Card>
              <CardHeader>
                <CardTitle>How to Read an Options Chain</CardTitle>
                <CardDescription>The options chain shows all available options for a stock</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th colSpan={4} className="text-center py-2 bg-green-50 dark:bg-green-950/30">CALLS</th>
                        <th className="py-2 px-4 bg-gray-100 dark:bg-gray-800">Strike</th>
                        <th colSpan={4} className="text-center py-2 bg-red-50 dark:bg-red-950/30">PUTS</th>
                      </tr>
                      <tr className="border-b text-xs">
                        <th className="py-2 px-2">Bid</th>
                        <th className="py-2 px-2">Ask</th>
                        <th className="py-2 px-2">Vol</th>
                        <th className="py-2 px-2">OI</th>
                        <th className="py-2 px-4 bg-gray-100 dark:bg-gray-800"></th>
                        <th className="py-2 px-2">Bid</th>
                        <th className="py-2 px-2">Ask</th>
                        <th className="py-2 px-2">Vol</th>
                        <th className="py-2 px-2">OI</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <td className="py-2 px-2">8.50</td>
                        <td className="py-2 px-2">8.70</td>
                        <td className="py-2 px-2">1,234</td>
                        <td className="py-2 px-2">5,678</td>
                        <td className="py-2 px-4 font-bold bg-gray-100 dark:bg-gray-800">170</td>
                        <td className="py-2 px-2">1.20</td>
                        <td className="py-2 px-2">1.35</td>
                        <td className="py-2 px-2">567</td>
                        <td className="py-2 px-2">2,345</td>
                      </tr>
                      <tr className="border-b bg-yellow-50/50 dark:bg-yellow-950/20">
                        <td className="py-2 px-2">5.00</td>
                        <td className="py-2 px-2">5.20</td>
                        <td className="py-2 px-2">2,456</td>
                        <td className="py-2 px-2">8,901</td>
                        <td className="py-2 px-4 font-bold bg-gray-100 dark:bg-gray-800">175 ← ATM</td>
                        <td className="py-2 px-2">3.80</td>
                        <td className="py-2 px-2">4.00</td>
                        <td className="py-2 px-2">1,890</td>
                        <td className="py-2 px-2">6,789</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-2">2.80</td>
                        <td className="py-2 px-2">2.95</td>
                        <td className="py-2 px-2">3,567</td>
                        <td className="py-2 px-2">12,345</td>
                        <td className="py-2 px-4 font-bold bg-gray-100 dark:bg-gray-800">180</td>
                        <td className="py-2 px-2">6.50</td>
                        <td className="py-2 px-2">6.75</td>
                        <td className="py-2 px-2">890</td>
                        <td className="py-2 px-2">4,567</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <strong>Bid:</strong> Price buyers will pay
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>Ask:</strong> Price sellers want
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>Vol:</strong> Contracts traded today
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>OI:</strong> Open Interest (total contracts)
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pros & Cons Tab */}
          <TabsContent value="proscons" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Advantages */}
              <Card>
                <CardHeader className="bg-green-50 dark:bg-green-950/30 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    Advantages of Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-4">
                    {prosAndCons.pros.map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Risks */}
              <Card>
                <CardHeader className="bg-red-50 dark:bg-red-950/30 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-5 w-5" />
                    Risks to Consider
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-4">
                    {prosAndCons.cons.map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Risk Warning */}
            <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Important Risk Disclosure</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Options trading involves significant risk and is not suitable for all investors. You can lose your entire investment in a relatively short period of time.
                      Before trading options, read the Characteristics and Risks of Standardized Options. Practice with virtual trading first!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-900">
              <h3 className="font-semibold text-cyan-800 dark:text-cyan-200 flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
                Common questions from beginner options traders
              </p>
            </div>

            <Card>
              <CardContent className="py-2">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} {...faq} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* The Greeks Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Preview: The Greeks (Advanced)
            </CardTitle>
            <CardDescription>
              These measure how options prices change - you&apos;ll learn more in the strategies section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">Δ</p>
                <p className="text-sm font-medium">Delta</p>
                <p className="text-xs text-muted-foreground">Price sensitivity</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">Γ</p>
                <p className="text-sm font-medium">Gamma</p>
                <p className="text-xs text-muted-foreground">Delta&apos;s rate of change</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">Θ</p>
                <p className="text-sm font-medium">Theta</p>
                <p className="text-xs text-muted-foreground">Time decay</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">V</p>
                <p className="text-sm font-medium">Vega</p>
                <p className="text-xs text-muted-foreground">Volatility sensitivity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps CTA */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready for the Next Step?</h3>
            <p className="mb-4 opacity-90 text-sm sm:text-base">
              Now that you understand the basics, learn about specific trading strategies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/education">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Learn Strategies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/trading">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 hover:bg-white/20">
                  Practice Trading
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
