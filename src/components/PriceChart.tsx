import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Dot } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
  ticker: string;
  data: Array<{
    date: string;
    price: number;
    signal?: 'buy' | 'sell';
    volume: number;
  }>;
}

const PriceChart = ({ ticker, data }: PriceChartProps) => {
  const currentPrice = data[data.length - 1]?.price || 0;
  const previousPrice = data[data.length - 2]?.price || 0;
  const change = currentPrice - previousPrice;
  const changePercent = ((change / previousPrice) * 100);
  const isPositive = change >= 0;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.signal) return null;
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={4}
        fill={payload.signal === 'buy' ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))'}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-mono">{ticker}</h3>
            <p className="text-sm text-muted-foreground">Stock Price Chart</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-bullish"></div>
            Buy Signal
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-bearish"></div>
            Sell Signal
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PriceChart;