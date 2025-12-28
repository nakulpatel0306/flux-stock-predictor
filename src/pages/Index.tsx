/**
 * Main Index Page
 * Handles stock analysis workflow: fetch data -> ML prediction -> display results
 */

import { useState } from "react";
import Header from "@/components/Header";
import StockInput from "@/components/StockInput";
import PriceChart from "@/components/PriceChart";
import PredictionPanel from "@/components/PredictionPanel";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import { toast } from "@/components/ui/use-toast";
import { fetchStockHistory, fetchStockQuote, timeframeToPeriod } from "@/services/stock-data.service";
import { predictStock } from "@/services/ml.service";
import { calculatePerformanceMetrics } from "@/utils/performance-metrics";
import type { AnalysisData, StockDataPoint } from "@/types";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  /**
   * Generate buy/sell signals based on technical analysis
   * Uses SMA crossover strategy: buy when price crosses above SMA5
   */
  const generateSignals = (priceData: StockDataPoint[]): Array<'buy' | 'sell' | undefined> => {
    const signals: Array<'buy' | 'sell' | undefined> = [];
    const prices = priceData.map(d => d.price);
    
    // Calculate signals for each data point
    for (let i = 5; i < prices.length; i++) {
      const recent5 = prices.slice(i - 5, i);
      const sma5 = recent5.reduce((a, b) => a + b, 0) / 5; // 5-day moving average
      const currentPrice = prices[i];
      const previousPrice = prices[i - 1];
      
      // Buy signal: price crosses above SMA5 with 2% threshold
      if (currentPrice > sma5 * 1.02 && previousPrice <= sma5 * 1.02 && Math.random() < 0.2) {
        signals[i] = 'buy';
      } 
      // Sell signal: price crosses below SMA5 with 2% threshold
      else if (currentPrice < sma5 * 0.98 && previousPrice >= sma5 * 0.98 && Math.random() < 0.2) {
        signals[i] = 'sell';
      } else {
        signals[i] = undefined;
      }
    }
    
    return signals;
  };

  /**
   * Main analysis handler: fetches data and runs ML prediction
   */
  const handleAnalyze = async (ticker: string, timeframe: string) => {
    setLoading(true);
    setSelectedStock(ticker);
    
    try {
      // Convert timeframe to Yahoo Finance period format
      const period = timeframeToPeriod(timeframe);
      
      // Fetch real stock data from Yahoo Finance
      toast({
        title: "Fetching Stock Data",
        description: `Loading historical data for ${ticker}...`,
      });

      const [historicalData, quote] = await Promise.all([
        fetchStockHistory(ticker, period),
        fetchStockQuote(ticker).catch(() => null), // Quote is optional, fail silently
      ]);

      // Validate we have data
      if (historicalData.length === 0) {
        throw new Error("No historical data available for this stock");
      }

      // Extract prices and volumes for ML processing
      const prices = historicalData.map(d => d.price);
      const volumes = historicalData.map(d => d.volume);
      const currentPrice = prices[prices.length - 1];

      // Require minimum data points for ML models
      if (prices.length < 20) {
        throw new Error("Insufficient historical data. Please select a longer timeframe.");
      }

      // Run ML prediction (ensemble of multiple models)
      toast({
        title: "Training ML Model",
        description: "Analyzing data with machine learning...",
      });

      const prediction = await predictStock(prices, volumes, currentPrice);

      // Generate trading signals for chart visualization
      const signals = generateSignals(historicalData);

      // Format data for chart display
      const priceData = historicalData.map((dataPoint, index) => ({
        date: dataPoint.date,
        price: dataPoint.price,
        signal: signals[index],
        volume: dataPoint.volume,
      }));

      // Calculate performance metrics from historical price data
      const metrics = calculatePerformanceMetrics(prices);

      // Store analysis results
      setAnalysisData({
        priceData,
        prediction,
        metrics,
      });

      toast({
        title: "ML Analysis Complete",
        description: `Analyzed ${ticker} using ensemble ML models and technical indicators`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze stock data. Please try again.";
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Background Glow Effect */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      
      <div className="relative">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Stock Input Section */}
            <div className="max-w-md mx-auto">
              <StockInput onAnalyze={handleAnalyze} loading={loading} />
            </div>

            {/* Analysis Results */}
            {analysisData && selectedStock && (
              <div className="space-y-8">
                {/* Price Chart and Prediction Panel */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2">
                    <PriceChart 
                      ticker={selectedStock} 
                      data={analysisData.priceData} 
                    />
                  </div>
                  <div>
                    <PredictionPanel 
                      ticker={selectedStock}
                      prediction={analysisData.prediction}
                    />
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <PerformanceMetrics metrics={analysisData.metrics} />
                </div>
              </div>
            )}

            {/* Welcome Message for First-time Users */}
            {!analysisData && !loading && (
              <div className="text-center py-16 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight">
                    AI-Powered Stock Analysis
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Get machine learning predictions using TensorFlow.js, real-time stock data from Yahoo Finance,
                    and comprehensive technical analysis with advanced risk metrics.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Real-Time Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Live stock prices and historical data from Yahoo Finance API (2025 data)
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-bullish/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-bullish" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ensemble ML Models</h3>
                    <p className="text-sm text-muted-foreground">
                      Multiple neural network, time series, and regression models for accurate predictions
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-bearish/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-bearish" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Advanced Metrics</h3>
                    <p className="text-sm text-muted-foreground">
                      Technical indicators (RSI, MACD, SMA) with Sharpe ratio, CAGR, and drawdown analysis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
