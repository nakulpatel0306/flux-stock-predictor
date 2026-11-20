/**
 * Time Series Model for Stock Prediction
 * Dense network on the last 10 daily returns, predicting the next day's return
 * Good for capturing short-term momentum and mean reversion
 */

import * as tf from '@tensorflow/tfjs';
import { RETURN_WINDOW, mean, returnToUpProbability, std, type DirectionModel, type Sample } from './dataset';

const SEED = 21;

/**
 * Create a time series model that maps a window of returns to the next return
 */
function createTimeSeriesModel(sequenceLength: number): tf.Sequential {
  const init = (offset: number) => tf.initializers.glorotUniform({ seed: SEED + offset });
  const model = tf.sequential({
    layers: [
      // Flatten input sequence
      tf.layers.flatten({ inputShape: [sequenceLength, 1] }),

      // Dense layers for trend analysis
      tf.layers.dense({ units: 32, activation: 'relu', kernelInitializer: init(0) }),
      tf.layers.dropout({ rate: 0.1, seed: SEED }),
      tf.layers.dense({ units: 16, activation: 'relu', kernelInitializer: init(1) }),

      // Output: next return in standardized units
      tf.layers.dense({ units: 1, activation: 'linear', kernelInitializer: init(2) }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
  });

  return model;
}

/**
 * Train on return windows scaled by the training returns' spread (prices themselves
 * trend, so min-max scaling them would leak the future range into the inputs)
 */
export async function trainTimeSeries(train: Sample[]): Promise<DirectionModel> {
  if (train.length < 10) {
    throw new Error('Insufficient training data');
  }

  const targets = train.map(s => s.nextReturn);
  const returnMean = mean(targets);
  const returnStd = std(targets);
  const toWindow = (s: Sample) => s.recentReturns.map(r => [(r - returnMean) / returnStd]);

  const model = createTimeSeriesModel(RETURN_WINDOW);
  const xs = tf.tensor3d(train.map(toWindow));
  const ys = tf.tensor2d(targets.map(t => [(t - returnMean) / returnStd]));
  try {
    await model.fit(xs, ys, { epochs: 30, batchSize: 16, shuffle: false, verbose: 0 });
  } finally {
    xs.dispose();
    ys.dispose();
  }

  const predictReturns = async (samples: Sample[]) => {
    const output = tf.tidy(() => model.predict(tf.tensor3d(samples.map(toWindow))) as tf.Tensor);
    const values = Array.from(await output.data());
    output.dispose();
    return values.map(z => z * returnStd + returnMean);
  };

  const fitted = await predictReturns(train);
  const residualStd = std(targets.map((t, k) => t - fitted[k]));

  return {
    async predictUp(samples) {
      return (await predictReturns(samples)).map(r => returnToUpProbability(r, residualStd));
    },
    dispose: () => model.dispose(),
  };
}
