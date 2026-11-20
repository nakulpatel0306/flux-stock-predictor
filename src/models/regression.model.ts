/**
 * Regression Model for Stock Prediction
 * Ridge regression on the 8 indicator features, predicting next-day return
 * Simple but interpretable model
 */

import * as tf from '@tensorflow/tfjs';
import { fitScaler, mean, returnToUpProbability, std, type DirectionModel, type Sample } from './dataset';

const SEED = 7;

/**
 * Create a linear regression model with L2 (ridge) regularization
 */
function createRegressionModel(inputSize: number): tf.Sequential {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [inputSize],
        units: 1,
        activation: 'linear',
        kernelInitializer: tf.initializers.glorotUniform({ seed: SEED }),
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }), // Ridge regularization
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
  });

  return model;
}

async function predictColumn(model: tf.Sequential, rows: number[][]): Promise<number[]> {
  const output = tf.tidy(() => model.predict(tf.tensor2d(rows)) as tf.Tensor);
  const values = Array.from(await output.data());
  output.dispose();
  return values;
}

/**
 * Train on standardized features and standardized returns, then report P(up)
 * from the de-normalized return forecast and the model's training error
 */
export async function trainRegression(train: Sample[]): Promise<DirectionModel> {
  if (train.length < 10) {
    throw new Error('Insufficient training data');
  }

  const scale = fitScaler(train.map(s => s.features));
  const targets = train.map(s => s.nextReturn);
  const targetMean = mean(targets);
  const targetStd = std(targets);
  const model = createRegressionModel(train[0].features.length);

  const trainRows = train.map(s => scale(s.features));
  const xs = tf.tensor2d(trainRows);
  const ys = tf.tensor1d(targets.map(t => (t - targetMean) / targetStd));
  try {
    await model.fit(xs, ys, { epochs: 100, batchSize: 32, shuffle: false, verbose: 0 });
  } finally {
    xs.dispose();
    ys.dispose();
  }

  const predictReturns = async (rows: number[][]) =>
    (await predictColumn(model, rows)).map(z => z * targetStd + targetMean);

  const fitted = await predictReturns(trainRows);
  const residualStd = std(targets.map((t, k) => t - fitted[k]));

  return {
    async predictUp(samples) {
      const predicted = await predictReturns(samples.map(s => scale(s.features)));
      return predicted.map(r => returnToUpProbability(r, residualStd));
    },
    dispose: () => model.dispose(),
  };
}
