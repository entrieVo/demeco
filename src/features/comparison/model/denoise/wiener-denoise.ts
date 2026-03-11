import { cloneFloat32Array } from "../utils/audio-processing";
import { fft, Complex, ifft } from "../utils/fft";
import { computeDenoiseVariance } from "../utils/normalize";
import {
	computeAudioSignalPower,
	computeImageSignalPower,
} from "../utils/probability_tools";
import { hannWindow, binProps, createSpectrum } from "../utils/stft";

const MIN_GAIN = 0.2;

export async function wienerDenoise(
	signal: Float32Array[],
	relativeNoiseLevel: number
): Promise<Float32Array[]>;

export async function wienerDenoise(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width?: number,
	height?: number
): Promise<Uint8ClampedArray>;

export async function wienerDenoise(
	signal: Float32Array[] | Uint8ClampedArray,
	relativeNoiseLevel: number,
	width?: number,
	height?: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioWienerFilter(signal, relativeNoiseLevel);
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageWienerFilter(signal, relativeNoiseLevel, width, height);

	return signal;
}

// [SECTION/> Аудио

function audioWienerFilter(
	signal: Float32Array[],
	relativeNoiseLevel: number
): Float32Array[] {
	const sigma = computeDenoiseVariance(
		relativeNoiseLevel,
		computeAudioSignalPower(signal)
	);
	const frameSize = 512;
	const windowEnergy = frameSize * 0.375;
	const noiseVarianceFreq = sigma * windowEnergy;

	return stft(signal, noiseVarianceFreq);
}

function wienerFilter(
	amplitude: Float32Array,
	noiseVariance: number,
	minGain: number = MIN_GAIN
): Float32Array {
	const N = amplitude.length;
	const filtered = new Float32Array(N);

	for (let k = 0; k < N; k++) {
		const signalPower = Math.max(0, amplitude[k] ** 2 - noiseVariance);
		const wienerGain = signalPower / (signalPower + noiseVariance);
		const clampedGain = Math.max(minGain, Math.min(1, wienerGain));

		filtered[k] = clampedGain * amplitude[k];
	}

	// Симметрия спектра (для вещественного сигнала)
	for (let k = 1; k < N / 2; k++) {
		filtered[N - k] = filtered[k];
	}

	return filtered;
}

function stft(signal: Float32Array[], sigma: number): Float32Array[] {
	const frameSize = 512;
	const hopSize = Math.floor(frameSize / 2);

	return signal.map((channel) => {
		const data = cloneFloat32Array(channel);
		const size = data.length;
		const windowSum = new Float32Array(size);

		const result = new Float32Array(size);

		for (let i = 0; i * hopSize < size; i++) {
			const start = i * hopSize;

			for (let j = 0; j < frameSize && start + j < size; j++) {
				windowSum[start + j] +=
					hannWindow(j, frameSize) * hannWindow(j, frameSize);
			}

			const frame = new Float32Array(frameSize);
			for (let j = 0; j < frameSize; j++)
				frame[j] =
					start + j < size ? data[start + j] * hannWindow(j, frameSize) : 0;

			const spectrum = fft(frame);
			const { amplitude, phase } = binProps(spectrum);

			const filteredAmplitude = wienerFilter(amplitude, sigma);

			const filteredSpectrum: Complex[] = createSpectrum(
				filteredAmplitude,
				phase
			);

			const timeFrame = ifft(filteredSpectrum);

			for (let j = 0; j < frameSize; j++) {
				if (start + j < size) {
					result[start + j] += timeFrame[j] * hannWindow(j, frameSize);
				}
			}
		}

		for (let i = 0; i < size; i++) {
			if (windowSum[i] > 0) {
				result[i] /= windowSum[i];
			}
		}

		return result;
	});
}

// [!SECTION/> !Аудио

// [SECTION/> Изображения

function imageWienerFilter(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width: number,
	height: number
): Uint8ClampedArray {
	const sigma = computeDenoiseVariance(
		relativeNoiseLevel,
		computeImageSignalPower(signal)
	);
	const windowRadius = 2;
	const filteredSignal = new Uint8ClampedArray(signal.length);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;

			const originalY =
				(0.299 * signal[idx] +
					0.587 * signal[idx + 1] +
					0.114 * signal[idx + 2]) /
				255;

			const { mean, variance } = calculateLocalStatsY(
				signal,
				x,
				y,
				width,
				height,
				windowRadius
			);

			const signalVariance = Math.max(0, variance - sigma);
			const wienerGain = signalVariance / (signalVariance + sigma + 1e-10);
			const clampedGain = Math.max(MIN_GAIN, Math.min(1, wienerGain));

			const filteredY = mean + clampedGain * (originalY - mean);
			const clampedY = Math.max(0, Math.min(1, filteredY));

			const scale = originalY > 1e-6 ? clampedY / originalY : 1;
			const clampedScale = Math.max(0, Math.min(2.0, scale));

			filteredSignal[idx] = Math.max(
				0,
				Math.min(255, Math.round(signal[idx] * clampedScale))
			);
			filteredSignal[idx + 1] = Math.max(
				0,
				Math.min(255, Math.round(signal[idx + 1] * clampedScale))
			);
			filteredSignal[idx + 2] = Math.max(
				0,
				Math.min(255, Math.round(signal[idx + 2] * clampedScale))
			);
			filteredSignal[idx + 3] = signal[idx + 3]; // Alpha
		}
	}

	return filteredSignal;
}

function calculateLocalStatsY(
	img: Uint8ClampedArray,
	centerX: number,
	centerY: number,
	width: number,
	height: number,
	radius: number
): { mean: number; variance: number } {
	let sum = 0;
	let sumSq = 0;
	let count = 0;

	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			const x = Math.max(0, Math.min(width - 1, centerX + dx));
			const y = Math.max(0, Math.min(height - 1, centerY + dy));

			const idx = (y * width + x) * 4;
			const yVal =
				(0.299 * img[idx] + 0.587 * img[idx + 1] + 0.114 * img[idx + 2]) / 255;

			sum += yVal;
			sumSq += yVal * yVal;
			count++;
		}
	}

	const mean = sum / count;
	const variance = sumSq / count - mean * mean;

	return { mean, variance };
}

// [!SECTION/> !Изображения
