import { cloneFloat32Array } from "../utils/audio-processing";
import { computeAudioVariance, computeImageVariance } from "../utils/normalize";
import { normalDistribution } from "../utils/probability_tools";

export async function gaussianNoise(
	signal: Float32Array[],
	relativeNoiseLevel: number
): Promise<Float32Array[]>;

export async function gaussianNoise(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number
): Promise<Uint8ClampedArray>;

export async function gaussianNoise(
	signal: Float32Array[] | Uint8ClampedArray,
	relativeNoiseLevel: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioGaussianNoise(signal, computeAudioVariance(relativeNoiseLevel));
	else if (signal instanceof Uint8ClampedArray)
		return imageGaussianNoise(
			signal,
			0,
			computeImageVariance(relativeNoiseLevel)
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
