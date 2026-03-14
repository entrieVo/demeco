import { cloneFloat32Array } from "@/features/comparison/model/utils/audio-processing";
import { computeDenoiseVariance } from "../utils/normalize";
import {
	computeAudioSignalPower,
	computeImageSignalPower,
} from "../utils/probability_tools";

const AUDIO_WINDOW_SIZE = 32;
const DEFAULT_BLOCK_SIZE = Math.round(AUDIO_WINDOW_SIZE ** 0.5);
const MIN_GAIN = 0.3;

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
		return audioBayesianFilter(signal, relativeNoiseLevel);
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageBayesianFilter(signal, relativeNoiseLevel, width, height);

	return signal;
}

// [SECTION/> Аудио

function audioBayesianFilter(
	signal: Float32Array[],
	relativeNoiseLevel: number
): Float32Array[] {
	const sigma = computeDenoiseVariance(
		relativeNoiseLevel,
		computeAudioSignalPower(signal)
	);
	const N = 32;
	const r = Math.floor(N / 2);

	return signal.map((channel) => {
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
			const signalVariance = Math.max(0, localVariance - sigma);
			let gain = signalVariance / (signalVariance + sigma + 1e-10);
			gain = Math.max(MIN_GAIN, Math.min(1, gain));

			result[i] = mean + gain * (signal[i] - mean);

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

// [!SECTION/> !Аудио
// [SECTION/> Изображения

export async function imageBayesianFilter(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width: number,
	height: number,
	blockSize: number = DEFAULT_BLOCK_SIZE
): Promise<Uint8ClampedArray> {
	const sigma = computeDenoiseVariance(
		relativeNoiseLevel,
		computeImageSignalPower(signal)
	);

	const result = new Uint8ClampedArray(signal.length);

	for (let by = 0; by < height; by += blockSize) {
		for (let bx = 0; bx < width; bx += blockSize) {
			const luminanceBlock: number[] = [];
			const pixelInfo: Array<{
				x: number;
				y: number;
				idx: number;
				rgb: [number, number, number];
			}> = [];

			for (let y = by; y < Math.min(by + blockSize, height); y++) {
				for (let x = bx; x < Math.min(bx + blockSize, width); x++) {
					const idx = (y * width + x) * 4;

					const r = signal[idx];
					const g = signal[idx + 1];
					const b = signal[idx + 2];

					const yVal = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

					luminanceBlock.push(yVal);
					pixelInfo.push({ x, y, idx, rgb: [r, g, b] });
				}
			}

			const mean =
				luminanceBlock.reduce((a, b) => a + b, 0) / luminanceBlock.length;
			const variance =
				luminanceBlock.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
				luminanceBlock.length;

			const signalVariance = Math.max(0, variance - sigma);
			const gain = signalVariance / (signalVariance + sigma + 1e-10);

			for (let i = 0; i < pixelInfo.length; i++) {
				const { idx, rgb } = pixelInfo[i];
				const originalY = luminanceBlock[i];

				const filteredY = mean + gain * (originalY - mean);
				const clampedY = Math.max(0, Math.min(1, filteredY));

				const scale = originalY > 1e-6 ? clampedY / originalY : 1;
				const clampedScale = Math.max(0, Math.min(2.0, scale));

				result[idx] = Math.max(
					0,
					Math.min(255, Math.round(rgb[0] * clampedScale))
				);
				result[idx + 1] = Math.max(
					0,
					Math.min(255, Math.round(rgb[1] * clampedScale))
				);
				result[idx + 2] = Math.max(
					0,
					Math.min(255, Math.round(rgb[2] * clampedScale))
				);
				result[idx + 3] = signal[idx + 3];
			}
		}
	}

	return result;
}

// [!SECTION/> !Изображения
