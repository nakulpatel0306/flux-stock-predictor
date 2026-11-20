import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Brain, Target } from "lucide-react";
import { MIN_HOLDOUT_SAMPLES } from "@/models";
import type { PredictionResult } from "@/types";

interface PredictionPanelProps {
  ticker: string;
  prediction: PredictionResult;
}

const PredictionPanel = ({ ticker, prediction }: PredictionPanelProps) => {
  const { direction, probability, expectedReturn, confidence, method, holdout } = prediction;
  const isPositive = direction === 'up';
  const holdoutMeasured = holdout !== null && holdout.samples >= MIN_HOLDOUT_SAMPLES;
  const holdoutNote = holdoutMeasured
    ? `on ${holdout.samples} held-out days`
    : holdout
      ? `only ${holdout.samples} held-out days`
      : 'no trained models';

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
              <div className="text-sm text-muted-foreground">Holdout Accuracy</div>
              <div className="text-xl font-bold text-primary">
                {holdoutMeasured ? `${holdout.accuracy}%` : 'n/a'}
              </div>
              <div className="text-xs text-muted-foreground">{holdoutNote}</div>
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
          {method === 'ensemble'
            ? 'Blend of three models trained on this price history. Expected return is the up probability applied to the stock\'s average up and down day over the last 60 sessions.'
            : 'Rule-based score from technical indicators: this timeframe has too little history to train the models. Pick 3M or longer for the ML forecast.'}
          {' '}Not financial advice.
        </div>
      </div>
    </Card>
  );
};

export default PredictionPanel;