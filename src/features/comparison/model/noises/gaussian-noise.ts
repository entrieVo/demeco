import { normalDistribution } from "../probability_tools";
import { cloneFloat32Array } from "../audio-processing";

export async function gaussianNoise(
	signal: Float32Array[],
	noiseVariance: number
): Promise<Float32Array[]>;

export async function gaussianNoise(
	signal: Uint8ClampedArray,
	noiseVariance: number
): Promise<Uint8ClampedArray>;

export async function gaussianNoise(
	signal: Float32Array[] | Uint8ClampedArray,
	noiseVariance: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioGaussianNoise(signal, noiseVariance);
	else if (signal instanceof Uint8ClampedArray)
		return imageGaussianNoise(signal, 0, noiseVariance);

	return signal;
}

function imageGaussianNoise(
	data: Uint8ClampedArray,
	mu: number,
	sigma: number
): Uint8ClampedArray {
	const newData = new Uint8ClampedArray(data);

	for (let i = 0; i < newData.length; i += 4) {
		newData[i] = newData[i] + normalDistribution(mu, sigma);
		newData[i + 1] = newData[i + 1] + normalDistribution(mu, sigma);
		newData[i + 2] = newData[i + 2] + normalDistribution(mu, sigma);
	}

	return newData;
}

function audioGaussianNoise(
	data: Float32Array[],
	noiseVariance: number
): Float32Array[] {
	let newData = data.map((ch) => cloneFloat32Array(ch));

	newData = newData.map((channel) =>
		channel.map((ch) =>
			Math.max(-1, Math.min(1, ch + normalDistribution(0, noiseVariance)))
		)
	);

	return newData;
}
