import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Brain, Target } from "lucide-react";

interface PredictionPanelProps {
  ticker: string;
  prediction: {
    direction: 'up' | 'down';
    probability: number;
    expectedReturn: number;
    confidence: 'high' | 'medium' | 'low';
    modelAccuracy: number;
  };
}

const PredictionPanel = ({ ticker, prediction }: PredictionPanelProps) => {
  const { direction, probability, expectedReturn, confidence, modelAccuracy } = prediction;
  const isPositive = direction === 'up';

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return 'bg-bullish text-bullish-foreground';
      case 'medium': return 'bg-neutral text-neutral-foreground';
      case 'low': return 'bg-bearish text-bearish-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Prediction</h3>
          </div>
          <p className="text-sm text-muted-foreground">Next day outlook for {ticker}</p>
        </div>

        <div className="space-y-4">
          {/* Direction Prediction */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              {isPositive ? (
                <TrendingUp className="w-8 h-8 text-bullish" />
              ) : (
                <TrendingDown className="w-8 h-8 text-bearish" />
              )}
              <div>
                <div className={`text-3xl font-bold ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                  {direction.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {probability}% probability
                </div>
              </div>
            </div>
            
            <Progress 
              value={probability} 
              className={`w-full h-3 ${isPositive ? '[&>div]:bg-bullish' : '[&>div]:bg-bearish'}`}
            />
          </div>

          {/* Expected Return */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
              <Target className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Expected Return</div>
              <div className={`text-xl font-bold ${expectedReturn >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {expectedReturn >= 0 ? '+' : ''}{expectedReturn.toFixed(2)}%
              </div>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
              <Brain className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Model Accuracy</div>
              <div className="text-xl font-bold text-primary">
                {modelAccuracy}%
              </div>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="flex items-center justify-center">
            <Badge className={`${getConfidenceColor(confidence)} px-4 py-2 text-sm font-medium`}>
              {confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground border-t border-border/50 pt-4">
          Predictions are based on machine learning analysis of historical data and technical indicators.
          Past performance does not guarantee future results.
        </div>
      </div>
    </Card>
  );
};

export default PredictionPanel;