import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Target, Zap, Shield, Award, BarChart3 } from "lucide-react";

interface PerformanceMetricsProps {
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    sharpeRatio: number;
    cagr: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    avgReturn: number;
  };
}

const PerformanceMetrics = ({ metrics }: PerformanceMetricsProps) => {
  const performanceData = [
    { name: 'Jan', return: 2.3 },
    { name: 'Feb', return: -1.1 },
    { name: 'Mar', return: 4.2 },
    { name: 'Apr', return: 1.8 },
    { name: 'May', return: 3.1 },
    { name: 'Jun', return: -0.5 },
  ];

  const accuracyData = [
    { name: 'Correct', value: metrics.accuracy, color: 'hsl(var(--bullish))' },
    { name: 'Incorrect', value: 100 - metrics.accuracy, color: 'hsl(var(--muted))' }
  ];

  const getMetricColor = (value: number, thresholds: { good: number; bad: number }) => {
    if (value >= thresholds.good) return 'text-bullish';
    if (value <= thresholds.bad) return 'text-bearish';
    return 'text-neutral';
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-card to-secondary/10 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bullish/20">
              <Target className="w-5 h-5 text-bullish" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className={`text-2xl font-bold ${getMetricColor(metrics.accuracy, { good: 70, bad: 50 })}`}>
                {metrics.accuracy}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-card to-secondary/10 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className={`text-2xl font-bold ${getMetricColor(metrics.winRate, { good: 60, bad: 40 })}`}>
                {metrics.winRate}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-card to-secondary/10 border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral/20">
              <Zap className="w-5 h-5 text-neutral" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              <p className={`text-2xl font-bold ${getMetricColor(metrics.sharpeRatio, { good: 1.5, bad: 0.5 })}`}>
                {metrics.sharpeRatio.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backtesting Performance */}
        <Card className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Backtesting Performance</h3>
            </div>
            
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Bar 
                    dataKey="return" 
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Model Accuracy Breakdown */}
        <Card className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Model Accuracy</h3>
            </div>
            
            <div className="flex items-center justify-center h-40">
              <ResponsiveContainer width="80%" height="100%">
                <PieChart>
                  <Pie
                    data={accuracyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <div className="text-2xl font-bold text-bullish">{metrics.accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Risk & Return Metrics</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="text-sm text-muted-foreground">CAGR</div>
              <div className={`text-lg font-bold ${getMetricColor(metrics.cagr, { good: 15, bad: 5 })}`}>
                {metrics.cagr}%
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className={`text-lg font-bold ${getMetricColor(-metrics.maxDrawdown, { good: -10, bad: -25 })}`}>
                -{metrics.maxDrawdown}%
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="text-sm text-muted-foreground">Avg Return</div>
              <div className={`text-lg font-bold ${getMetricColor(metrics.avgReturn, { good: 2, bad: 0 })}`}>
                {metrics.avgReturn >= 0 ? '+' : ''}{metrics.avgReturn}%
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-lg font-bold text-foreground">
                {metrics.totalTrades}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;