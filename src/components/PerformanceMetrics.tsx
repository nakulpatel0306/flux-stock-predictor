import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Zap, Shield, FlaskConical } from "lucide-react";
import { MIN_HOLDOUT_SAMPLES } from "@/models";
import type { PerformanceMetrics as Metrics, PredictionResult } from "@/types";

interface PerformanceMetricsProps {
  metrics: Metrics;
  prediction: PredictionResult;
}

const PerformanceMetrics = ({ metrics, prediction }: PerformanceMetricsProps) => {
  const { holdout } = prediction;
  const measured = holdout !== null && holdout.samples >= MIN_HOLDOUT_SAMPLES ? holdout : null;

  const getMetricColor = (value: number, thresholds: { good: number; bad: number }) => {
    if (value >= thresholds.good) return 'text-bullish';
    if (value <= thresholds.bad) return 'text-bearish';
    return 'text-neutral';
  };

  const formatPct = (value: number | null) => (value === null ? 'n/a' : `${value}%`);

  const holdoutStats = measured
    ? [
        { label: 'Accuracy', value: formatPct(measured.accuracy), hint: 'Direction calls that were right' },
        { label: 'Precision', value: formatPct(measured.precision), hint: '"Up" calls that were right' },
        { label: 'Recall', value: formatPct(measured.recall), hint: 'Up days the models called' },
        { label: 'Always-up baseline', value: formatPct(measured.baselineAccuracy), hint: 'Accuracy of always guessing "up"' },
      ]
    : [];

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
              <p className="text-sm text-muted-foreground">Holdout Accuracy</p>
              <p className={`text-2xl font-bold ${measured ? getMetricColor(measured.accuracy - measured.baselineAccuracy, { good: 5, bad: 0 }) : 'text-muted-foreground'}`}>
                {measured ? `${measured.accuracy}%` : 'n/a'}
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
              <p className="text-sm text-muted-foreground">Up Days</p>
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

      {/* Holdout Evaluation */}
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/10 border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Holdout Results</h3>
          </div>

          {measured ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {holdoutStats.map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                    <div className="text-lg font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.hint}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                The models trained on the {measured.trainSamples} earlier days, then predicted the direction of each of
                the {measured.samples} most recent days without seeing them. Beating the always-up baseline is the bar
                that matters; on this little data, a few points either way is noise.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {holdout
                ? `Only ${holdout.samples} recent days could be held out for testing, too few for a meaningful accuracy (at least ${MIN_HOLDOUT_SAMPLES} needed). Choose 6M or 1Y to see holdout results.`
                : 'This timeframe has too little history to train the models, so there is nothing to evaluate. Choose 6M or 1Y to see holdout results.'}
            </p>
          )}
        </div>
      </Card>

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
              <div className="text-sm text-muted-foreground">Avg Daily Return</div>
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