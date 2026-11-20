import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, TrendingUp } from "lucide-react";
import { TICKER_HINT, normalizeTicker } from "@/services/ticker";

interface StockInputProps {
  onAnalyze: (ticker: string, timeframe: string) => void;
  loading?: boolean;
}

const StockInput = ({ onAnalyze, loading }: StockInputProps) => {
  const [ticker, setTicker] = useState("");
  const [timeframe, setTimeframe] = useState("1M");
  const [invalid, setInvalid] = useState(false);

  const popularStocks = ["AAPL", "TSLA", "GOOGL", "MSFT", "NVDA", "AMZN"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = normalizeTicker(ticker);
    setInvalid(!symbol);
    if (symbol) {
      onAnalyze(symbol, timeframe);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-secondary/20 border-border/50 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Stock Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Enter a ticker symbol to get AI-powered predictions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter ticker (e.g., AAPL)"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  setInvalid(false);
                }}
                className="text-center font-mono text-lg tracking-wide uppercase"
                maxLength={12}
                aria-invalid={invalid}
                aria-describedby={invalid ? "ticker-error" : undefined}
              />
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1M">1M</SelectItem>
                <SelectItem value="3M">3M</SelectItem>
                <SelectItem value="6M">6M</SelectItem>
                <SelectItem value="1Y">1Y</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invalid && (
            <p id="ticker-error" className="text-sm text-destructive text-center">
              That doesn't look like a ticker. {TICKER_HINT}.
            </p>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-glow"
            disabled={loading || !ticker.trim()}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Analyze Stock
              </div>
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">Popular stocks:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {popularStocks.map((stock) => (
              <Button
                key={stock}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTicker(stock);
                  setInvalid(false);
                }}
                className="font-mono text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {stock}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StockInput;