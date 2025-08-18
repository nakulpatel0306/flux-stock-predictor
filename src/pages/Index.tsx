import { useState } from "react";
import Header from "@/components/Header";
import StockInput from "@/components/StockInput";
import PriceChart from "@/components/PriceChart";
import PredictionPanel from "@/components/PredictionPanel";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Mock data generation for demonstration
  const generateMockData = (ticker: string, timeframe: string) => {
    const days = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : 365;
    const basePrice = Math.random() * 200 + 50; // Random base price between $50-$250
    
    const priceData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
      const trend = Math.sin(i / 20) * 0.01; // Long-term trend
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + trend + randomChange);
      
      // Add occasional buy/sell signals
      let signal = undefined;
      if (Math.random() < 0.1) {
        signal = Math.random() > 0.5 ? 'buy' : 'sell';
      }
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: parseFloat(price.toFixed(2)),
        signal,
        volume: Math.floor(Math.random() * 10000000) + 1000000
      };
    });

    const lastPrice = priceData[priceData.length - 1].price;
    const direction = Math.random() > 0.5 ? 'up' : 'down';
    const probability = Math.floor(Math.random() * 30 + 55); // 55-85% probability
    const expectedReturn = (Math.random() - 0.5) * 6; // -3% to +3%
    
    const confidence = probability > 75 ? 'high' : probability > 65 ? 'medium' : 'low';

    return {
      priceData,
      prediction: {
        direction,
        probability,
        expectedReturn: parseFloat(expectedReturn.toFixed(2)),
        confidence,
        modelAccuracy: Math.floor(Math.random() * 15 + 70) // 70-85% accuracy
      },
      metrics: {
        accuracy: Math.floor(Math.random() * 15 + 70),
        precision: Math.floor(Math.random() * 20 + 65),
        recall: Math.floor(Math.random() * 20 + 60),
        sharpeRatio: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
        cagr: parseFloat((Math.random() * 20 + 8).toFixed(1)),
        maxDrawdown: parseFloat((Math.random() * 15 + 5).toFixed(1)),
        winRate: Math.floor(Math.random() * 20 + 55),
        totalTrades: Math.floor(Math.random() * 500 + 100),
        avgReturn: parseFloat((Math.random() * 4 - 1).toFixed(2))
      }
    };
  };

  const handleAnalyze = async (ticker: string, timeframe: string) => {
    setLoading(true);
    setSelectedStock(ticker);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = generateMockData(ticker, timeframe);
      setAnalysisData(mockData);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${ticker} for ${timeframe} timeframe`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze stock data. Please try again.",
        variant: "destructive"
      });
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
                    Get machine learning predictions, technical analysis, and backtesting results 
                    for any stock ticker with advanced risk metrics.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Technical Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced indicators including RSI, MACD, moving averages, and volatility analysis
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-bullish/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-bullish" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">ML Predictions</h3>
                    <p className="text-sm text-muted-foreground">
                      Machine learning models trained on historical data to predict price movements
                    </p>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-bearish/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-bearish" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Risk Metrics</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive backtesting with Sharpe ratio, CAGR, drawdown analysis
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
