import { cloneFloat32Array } from "@/features/comparison/model/utils/audio-processing";
import { computeAudioVariance, computeImageVariance } from "../utils/normalize";

export async function bayesianDenoise(
	signal: Float32Array[],
	relativeNoiseLevel: number
): Promise<Float32Array[]>;

export async function bayesianDenoise(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width?: number,
	height?: number
): Promise<Uint8ClampedArray>;

export async function bayesianDenoise(
	signal: Float32Array[] | Uint8ClampedArray,
	relativeNoiseLevel: number,
	width?: number,
	height?: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioBayesianFilter(
			signal,
			computeAudioVariance(relativeNoiseLevel)
		);
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageBayesianFilter(
			signal,
			computeImageVariance(relativeNoiseLevel),
			width,
			height
		);

	return signal;
}

function audioBayesianFilter(
	audioBuffer: Float32Array[],
	relativeNoiseLevel: number
): Float32Array[] {
	const N = 32;
	const r = Math.floor(N / 2);

	return audioBuffer.map((channel) => {
		const signal = cloneFloat32Array(channel);
		const length = signal.length;
		const result = new Float32Array(length);

		function getSample(idx: number): number {
			if (idx < 0) return signal[-idx];
			if (idx >= length) return signal[2 * length - idx - 2];
			return signal[idx];
		}

		// первое окно
		let sum = 0;
		let sumSq = 0;
		for (let i = -r; i < r; i++) {
			const val = getSample(i);
			sum += val;
			sumSq += val * val;
		}

		for (let i = 0; i < length; i++) {
			const mean = sum / N;
			const localVariance = Math.max(0, sumSq / N - mean * mean);
			const signalVariance = Math.max(0, localVariance - relativeNoiseLevel);

			result[i] =
				mean +
				(signalVariance / (signalVariance + relativeNoiseLevel)) *
					(signal[i] - mean);

			// сдвиг окна
			const leave = getSample(i - r);
			const enter = getSample(i + r + 1);

			if (i < length - 1) {
				sum += enter - leave;
				sumSq += enter * enter - leave * leave;
			}
		}

		return result;
	});
}

export async function imageBayesianFilter(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width: number,
	height: number,
	blockSize: number = 5
): Promise<Uint8ClampedArray> {
	const result = new Uint8ClampedArray(signal.length);
	const channels = 4;

	for (let c = 0; c < 3; c++) {
		for (let by = 0; by < height; by += blockSize) {
			for (let bx = 0; bx < width; bx += blockSize) {
				const block: number[] = [];
				const positions: { x: number; y: number }[] = [];

				for (let y = by; y < Math.min(by + blockSize, height); y++) {
					for (let x = bx; x < Math.min(bx + blockSize, width); x++) {
						const idx = (y * width + x) * channels + c;
						block.push(signal[idx] / 255);
						positions.push({ x, y });
					}
				}

				const mean = block.reduce((a, b) => a + b, 0) / block.length;
				const variance =
					block.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / block.length;

				const signalVariance = Math.max(0, variance - relativeNoiseLevel);
				const gain =
					signalVariance / (signalVariance + relativeNoiseLevel + 1e-10);

				for (let i = 0; i < positions.length; i++) {
					const { x, y } = positions[i];
					const idx = (y * width + x) * channels + c;
					const filteredValue = mean + gain * (block[i] - mean);
					result[idx] = Math.round(
						Math.max(0, Math.min(1, filteredValue)) * 255
					);
				}
			}
		}
	}

	// альфа-канал
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * channels + 3;
			result[idx] = signal[idx];
		}
	}

	return result;
}
