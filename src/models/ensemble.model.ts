/**
 * Ensemble Model for Stock Prediction
 * Trains the three models on the older samples, scores the blend on the held-out recent ones,
 * then forecasts the next day with those same models
 */

import type { HoldoutMetrics, PredictionResult } from '@/types';
import {
  MIN_HOLDOUT_SAMPLES,
  buildSamples,
  expectedReturnFromProbability,
  scoreDirection,
  splitHoldout,
  type DirectionModel,
  type Sample,
} from './dataset';
import { trainNeuralNetwork } from './neural-network.model';
import { trainTimeSeries } from './time-series.model';
import { trainRegression } from './regression.model';

/**
 * Weights: Neural Network (50%), Time Series (30%), Regression (20%)
 */
const MODELS: Array<{ train: (samples: Sample[]) => Promise<DirectionModel>; weight: number }> = [
  { train: trainNeuralNetwork, weight: 0.5 },
  { train: trainTimeSeries, weight: 0.3 },
  { train: trainRegression, weight: 0.2 },
];

export async function predictWithEnsemble(
  prices: number[],
  volumes: number[],
  currentPrice: number
): Promise<PredictionResult> {
  const { labelled, latest } = buildSamples(prices, volumes);
  const { train, holdout } = splitHoldout(labelled);

  const trained = await Promise.all(
    MODELS.map(({ train: fit, weight }) =>
      fit(train)
        .then(model => ({ model, weight }))
        .catch(error => {
          console.warn('Ensemble member failed to train:', error);
          return null;
        })
    )
  );
  const members = trained.filter((m): m is { model: DirectionModel; weight: number } => m !== null);
  if (members.length === 0) {
    throw new Error('All ensemble models failed');
  }

  try {
    // Re-normalize weights in case a member failed
    const totalWeight = members.reduce((sum, m) => sum + m.weight, 0);
    const targets = [...holdout, latest];
    const perModel = await Promise.all(members.map(m => m.model.predictUp(targets)));
    const blended = targets.map((_, k) =>
      members.reduce((sum, m, j) => sum + perModel[j][k] * (m.weight / totalWeight), 0)
    );

    const holdoutMetrics: HoldoutMetrics | null =
      holdout.length > 0 ? scoreDirection(blended.slice(0, holdout.length), holdout, train.length) : null;

    const upProbability = blended[blended.length - 1];
    const direction: 'up' | 'down' = upProbability > 0.5 ? 'up' : 'down';
    const expectedReturn = expectedReturnFromProbability(upProbability, prices);
    const modelsAgree = perModel.every(p => p[p.length - 1] > 0.5 === upProbability > 0.5);

    return {
      direction,
      probability: Math.round(Math.max(upProbability, 1 - upProbability) * 100),
      expectedReturn: parseFloat((expectedReturn * 100).toFixed(2)),
      confidence: rateConfidence(upProbability, modelsAgree, holdoutMetrics),
      nextDayPrice: parseFloat((currentPrice * (1 + expectedReturn)).toFixed(2)),
      method: 'ensemble',
      holdout: holdoutMetrics,
    };
  } finally {
    members.forEach(m => m.model.dispose());
  }
}

/**
 * High needs a clear lean, every model on the same side, and a holdout record better than always guessing "up".
 * Without enough held-out days to check that record, confidence stays low.
 */
function rateConfidence(
  upProbability: number,
  modelsAgree: boolean,
  holdout: HoldoutMetrics | null
): 'high' | 'medium' | 'low' {
  const lean = Math.abs(upProbability - 0.5);
  const beatBaseline =
    holdout !== null && holdout.samples >= MIN_HOLDOUT_SAMPLES && holdout.accuracy > holdout.baselineAccuracy;
  if (!beatBaseline || !modelsAgree) return 'low';
  if (lean >= 0.15) return 'high';
  if (lean >= 0.05) return 'medium';
  return 'low';
}
