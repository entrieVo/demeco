import { cloneFloat32Array } from "../utils/audio-processing";
import {
	computeAudioNoiseVariance,
	computeImageNoiseVariance,
} from "../utils/normalize";
import { normalDistribution } from "../utils/probability_tools";

export function gaussianNoise(
	signal: Float32Array[],
	relativeNoiseLevel: number
): Float32Array[];

export function gaussianNoise(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number
): Uint8ClampedArray;

export function gaussianNoise(
	signal: Float32Array[] | Uint8ClampedArray,
	relativeNoiseLevel: number
): Float32Array[] | Uint8ClampedArray {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioGaussianNoise(
			signal,
			computeAudioNoiseVariance(relativeNoiseLevel)
		);
	else if (signal instanceof Uint8ClampedArray)
		return imageGaussianNoise(
			signal,
			0,
			computeImageNoiseVariance(relativeNoiseLevel)
		);

	return signal;
}

function imageGaussianNoise(
	data: Uint8ClampedArray,
	mu: number,
	sigma: number
): Uint8ClampedArray {
	const newData = new Uint8ClampedArray(data);

	const randomValue = () => {
		return normalDistribution(mu, sigma);
	};

	for (let i = 0; i < newData.length; i += 4) {
		newData[i] = newData[i] + randomValue();
		newData[i + 1] = newData[i + 1] + randomValue();
		newData[i + 2] = newData[i + 2] + randomValue();
	}

	return newData;
}

function audioGaussianNoise(
	data: Float32Array[],
	sigma: number
): Float32Array[] {
	let newData = data.map((ch) => cloneFloat32Array(ch));

	newData = newData.map((channel) =>
		channel.map((ch) =>
			Math.max(-1, Math.min(1, ch + normalDistribution(0, sigma)))
		)
	);

	return newData;
}
