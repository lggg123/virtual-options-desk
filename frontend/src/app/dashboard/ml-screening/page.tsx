'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Zap,
  Target,
  Shield,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface MLPrediction {
  symbol: string;
  score: number;
  rank: number;
  confidence: number;
  predicted_return: number;
  risk_score: number;
  factor_importance?: Record<string, number>;
  model_contributions?: {
    xgboost?: number;
    random_forest?: number;
    lightgbm?: number;
    lstm?: number;
  };
}

interface MLScreeningData {
  predictions: MLPrediction[];
  generated_at: string;
  model_version: string;
  total_screened?: number;
}

export default function MLScreeningPage() {
  const [data, setData] = useState<MLScreeningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<MLPrediction | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    fetchMLPredictions();
  }, []);

  async function fetchMLPredictions() {
    setLoading(true);
    try {
      console.log('[ML Screening] Fetching predictions...');
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD',
            'NFLX', 'DIS', 'BABA', 'TSM', 'INTC', 'ORCL', 'CRM', 'ADBE',
            'PYPL', 'SQ', 'SHOP', 'UBER', 'COIN', 'PLTR', 'SNOW', 'CRWD'
          ],
          top_n: 100
        })
      });

      console.log('[ML Screening] Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[ML Screening] Data received:', result);
        setData(result);
        if (result.predictions && result.predictions.length > 0) {
          setSelectedStock(result.predictions[0]);
        }
      } else {
        const errorData = await response.json();
        console.error('[ML Screening] Error response:', errorData);
      }
    } catch (error) {
      console.error('[ML Screening] Failed to fetch ML predictions:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRiskLevel = (riskScore: number): 'low' | 'medium' | 'high' => {
    if (riskScore < 30) return 'low';
    if (riskScore < 60) return 'medium';
    return 'high';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const filteredPredictions = data?.predictions.filter(p => {
    if (filterRisk === 'all') return true;
    return getRiskLevel(p.risk_score) === filterRisk;
  }) || [];

  const avgConfidence = data?.predictions ? data.predictions.reduce((sum, p) => sum + p.confidence, 0) / (data.predictions.length || 1) : 0;
  const avgReturn = data?.predictions ? data.predictions.reduce((sum, p) => sum + p.predicted_return, 0) / (data.predictions.length || 1) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-indigo-400 animate-pulse mx-auto mb-4" />
          <p className="text-white text-lg">Loading ML Predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-10 h-10 text-indigo-400" />
              <h1 className="text-4xl font-bold text-white">ML Stock Screening</h1>
            </div>
            <p className="text-gray-400">Multi-model ensemble predictions powered by AI</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={fetchMLPredictions}
              variant="outline"
              className="border-indigo-600 text-indigo-400 hover:bg-indigo-900/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Stocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-white">{data?.predictions.length || 0}</p>
                <Activity className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-white">{(avgConfidence * 100).toFixed(0)}%</p>
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Predicted Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className={`text-3xl font-bold ${avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                </p>
                {avgReturn >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Model Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-white">{data?.model_version || '1.0'}</p>
                <Award className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant={filterRisk === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterRisk('all')}
                size="sm"
              >
                All Stocks
              </Button>
              <Button 
                variant={filterRisk === 'low' ? 'default' : 'outline'}
                onClick={() => setFilterRisk('low')}
                size="sm"
                className={filterRisk === 'low' ? 'bg-green-600' : ''}
              >
                Low Risk
              </Button>
              <Button 
                variant={filterRisk === 'medium' ? 'default' : 'outline'}
                onClick={() => setFilterRisk('medium')}
                size="sm"
                className={filterRisk === 'medium' ? 'bg-yellow-600' : ''}
              >
                Medium Risk
              </Button>
              <Button 
                variant={filterRisk === 'high' ? 'default' : 'outline'}
                onClick={() => setFilterRisk('high')}
                size="sm"
                className={filterRisk === 'high' ? 'bg-red-600' : ''}
              >
                High Risk
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predictions List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Predictions ({filteredPredictions.length})
                </CardTitle>
                <CardDescription>
                  Ranked by ensemble model score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredPredictions.map((pred, index) => {
                    const riskLevel = getRiskLevel(pred.risk_score);
                    const isSelected = selectedStock?.symbol === pred.symbol;

                    return (
                      <div
                        key={pred.symbol}
                        onClick={() => setSelectedStock(pred)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-900/30 border-indigo-600' 
                            : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-indigo-400 border-indigo-600">
                              #{pred.rank}
                            </Badge>
                            <div>
                              <h3 className="text-lg font-bold text-white">{pred.symbol}</h3>
                              <p className="text-sm text-gray-400">Score: {pred.score.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${pred.predicted_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pred.predicted_return >= 0 ? '+' : ''}{pred.predicted_return.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">30-day prediction</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Confidence</p>
                            <div className="flex items-center gap-2">
                              <Progress value={pred.confidence * 100} className="h-2 flex-1" />
                              <span className="text-sm font-medium text-white">
                                {(pred.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Risk Level</p>
                            <div className="flex items-center gap-2">
                              <Shield className={`w-4 h-4 ${getRiskColor(riskLevel)}`} />
                              <span className={`text-sm font-medium ${getRiskColor(riskLevel)} capitalize`}>
                                {riskLevel}
                              </span>
                              <span className="text-xs text-gray-500">({pred.risk_score.toFixed(0)})</span>
                            </div>
                          </div>
                        </div>

                        {/* Model Scores Preview */}
                        {pred.model_contributions && (
                          <div className="grid grid-cols-4 gap-2">
                            {pred.model_contributions.xgboost !== undefined && (
                              <div className="text-center p-2 bg-slate-700/30 rounded">
                                <p className="text-xs text-gray-400">XGBoost</p>
                                <p className="text-sm font-bold text-white">
                                  {pred.model_contributions.xgboost.toFixed(1)}
                                </p>
                              </div>
                            )}
                            {pred.model_contributions.random_forest !== undefined && (
                              <div className="text-center p-2 bg-slate-700/30 rounded">
                                <p className="text-xs text-gray-400">RF</p>
                                <p className="text-sm font-bold text-white">
                                  {pred.model_contributions.random_forest.toFixed(1)}
                                </p>
                              </div>
                            )}
                            {pred.model_contributions.lightgbm !== undefined && (
                              <div className="text-center p-2 bg-slate-700/30 rounded">
                                <p className="text-xs text-gray-400">LightGBM</p>
                                <p className="text-sm font-bold text-white">
                                  {pred.model_contributions.lightgbm.toFixed(1)}
                                </p>
                              </div>
                            )}
                            {pred.model_contributions.lstm !== undefined && (
                              <div className="text-center p-2 bg-slate-700/30 rounded">
                                <p className="text-xs text-gray-400">LSTM</p>
                                <p className="text-sm font-bold text-white">
                                  {pred.model_contributions.lstm.toFixed(1)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Stock Details */}
          <div>
            <Card className="bg-slate-900/50 border-slate-800 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {selectedStock ? selectedStock.symbol : 'Select a Stock'}
                </CardTitle>
                <CardDescription>
                  Detailed ML Analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStock ? (
                  <div className="space-y-4">
                    {/* Prediction Summary */}
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Predicted 30-day Return</p>
                      <p className={`text-3xl font-bold ${selectedStock.predicted_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedStock.predicted_return >= 0 ? '+' : ''}{selectedStock.predicted_return.toFixed(2)}%
                      </p>
                    </div>

                    {/* Confidence & Risk */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">Confidence</p>
                        <p className="text-2xl font-bold text-white">
                          {(selectedStock.confidence * 100).toFixed(0)}%
                        </p>
                        <Progress value={selectedStock.confidence * 100} className="h-2 mt-2" />
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">Risk Score</p>
                        <p className={`text-2xl font-bold ${getRiskColor(getRiskLevel(selectedStock.risk_score))}`}>
                          {selectedStock.risk_score.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {getRiskLevel(selectedStock.risk_score)} Risk
                        </p>
                      </div>
                    </div>

                    {/* Model Ensemble Breakdown */}
                    {selectedStock.model_contributions && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Model Contributions
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(selectedStock.model_contributions).map(([model, score]) => {
                            const percentage = Math.abs(score) / selectedStock.score * 100;
                            return (
                              <div key={model}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-400 capitalize">{model.replace('_', ' ')}</span>
                                  <span className="text-white font-medium">{score.toFixed(2)}</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Feature Importance */}
                    {selectedStock.factor_importance && Object.keys(selectedStock.factor_importance).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Top Features
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(selectedStock.factor_importance)
                            .slice(0, 8)
                            .map(([factor, importance]) => (
                              <div key={factor}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-400 text-xs truncate">{factor}</span>
                                  <span className="text-white text-xs font-medium">
                                    {(importance * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={importance * 100} className="h-1.5" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Link href={`/trading?symbol=${selectedStock.symbol}`}>
                      <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">
                        View Trading Chart
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a stock to view detailed analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Footer */}
        <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">About ML Predictions</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  These predictions are generated by an ensemble of machine learning models including XGBoost, 
                  Random Forest, LightGBM, and LSTM networks. Confidence scores reflect model agreement, while 
                  risk scores consider volatility and fundamental factors. Always conduct your own research 
                  before making investment decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
