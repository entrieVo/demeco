import { cloneFloat32Array } from "../utils/audio-processing";
import { fft, Complex, ifft } from "../utils/fft";
import { computeDenoiseVariance } from "../utils/normalize";
import {
	computeAudioSignalPower,
	computeImageSignalPower,
} from "../utils/probability_tools";
import { hannWindow, binProps, createSpectrum } from "../utils/stft";

const MIN_GAIN = 0.2;

export function wienerDenoise<T extends Float32Array[] | Uint8ClampedArray>(
	signal: T,
	relativeNoiseLevel: number,
	width?: number,
	height?: number,
): T {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioWienerFilter(signal, relativeNoiseLevel) as unknown as T;
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageWienerFilter(
			signal,
			relativeNoiseLevel,
			width,
			height,
		) as unknown as T;

	return signal;
}

// [SECTION/> Аудиосигнал

function audioWienerFilter(
	signal: Float32Array[],
	relativeNoiseLevel: number,
): Float32Array[] {
	const sigma = computeDenoiseVariance(
		relativeNoiseLevel,
		computeAudioSignalPower(signal),
	);

	const frameSize = 512;

	// ⚠️ убрали windowEnergy — он больше не нужен
	const noiseVarianceFreq = sigma;

	return stft(signal, noiseVarianceFreq);
}

function wienerFilter(
	amplitude: Float32Array,
	noiseVariance: number,
	minGain: number = MIN_GAIN,
): Float32Array {
	const N = amplitude.length;
	const filtered = new Float32Array(N);

	for (let k = 0; k < N; k++) {
		const signalPower = Math.max(0, amplitude[k] ** 2 - noiseVariance);
		const gain = signalPower / (signalPower + noiseVariance + 1e-12);

		filtered[k] = Math.max(minGain, Math.min(1, gain)) * amplitude[k];
	}

	return filtered;
}

function stft(signal: Float32Array[], noiseVariance: number): Float32Array[] {
	const frameSize = 512;
	const hopSize = frameSize / 2;
	const pad = frameSize / 2;
	const EPS = 1e-8;

	return signal.map((channel) => {
		const input = cloneFloat32Array(channel);
		const size = input.length;

		const padded = new Float32Array(size + 2 * pad);
		padded.set(input, pad);

		const paddedSize = padded.length;

		const result = new Float32Array(paddedSize);
		const windowSum = new Float32Array(paddedSize);

		let frameIndex = 0;

		while (frameIndex * hopSize < paddedSize) {
			const start = frameIndex * hopSize;

			// --- окно + фрейм ---
			const frame = new Float32Array(frameSize);

			for (let j = 0; j < frameSize; j++) {
				const idx = start + j;
				const w = hannWindow(j, frameSize);

				frame[j] = idx < paddedSize ? padded[idx] * w : 0;

				if (idx < paddedSize) {
					windowSum[idx] += w * w;
				}
			}

			// --- FFT ---
			const spectrum = fft(frame);
			const { amplitude, phase } = binProps(spectrum);

			// --- Wiener ---
			const filteredAmplitude = wienerFilter(amplitude, noiseVariance);

			// --- сборка спектра ---
			const filteredSpectrum: Complex[] = createSpectrum(
				filteredAmplitude,
				phase,
			);

			// --- IFFT ---
			const timeFrame = ifft(filteredSpectrum);

			// --- overlap-add ---
			for (let j = 0; j < frameSize; j++) {
				const idx = start + j;
				if (idx < paddedSize) {
					result[idx] += timeFrame[j] * hannWindow(j, frameSize);
				}
			}

			frameIndex++;
		}

		// ✅ нормализация (устойчивая)
		for (let i = 0; i < paddedSize; i++) {
			result[i] /= windowSum[i] + EPS;
		}

		// ✅ убираем padding
		return result.subarray(pad, pad + size);
	});
}

// [!SECTION/> !Аудиосигнал

// [SECTION/> Видеосигнал

function imageWienerFilter(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width: number,
	height: number,
): Uint8ClampedArray {
	const sigma = computeDenoiseVariance(
		relativeNoiseLevel,
		computeImageSignalPower(signal),
	);
	const windowRadius = 2;
	const filteredSignal = new Uint8ClampedArray(signal.length);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;

			// Конвертируем RGB в YCbCr
			const r = signal[idx] / 255;
			const g = signal[idx + 1] / 255;
			const b = signal[idx + 2] / 255;

			const yOrig = 0.299 * r + 0.587 * g + 0.114 * b;
			const cbOrig = -0.168736 * r - 0.331264 * g + 0.5 * b + 0.5;
			const crOrig = 0.5 * r - 0.418688 * g - 0.081312 * b + 0.5;

			const { mean, variance } = calculateLocalStatsY(
				signal,
				x,
				y,
				width,
				height,
				windowRadius,
			);

			const signalVariance = Math.max(0, variance - sigma);
			const wienerGain = signalVariance / (signalVariance + sigma + 1e-10);
			const clampedGain = Math.max(MIN_GAIN, Math.min(1, wienerGain));

			// Применяем фильтр Винера только к яркости (Y)
			const filteredY = mean + clampedGain * (yOrig - mean);
			const clampedY = Math.max(0, Math.min(1, filteredY));

			// Конвертируем обратно в RGB с сохранением цветности
			const rNew = clampedY + 1.402 * (crOrig - 0.5);
			const gNew =
				clampedY - 0.344136 * (cbOrig - 0.5) - 0.714136 * (crOrig - 0.5);
			const bNew = clampedY + 1.772 * (cbOrig - 0.5);

			// Клэмпируем значения RGB
			filteredSignal[idx] = Math.max(0, Math.min(255, Math.round(rNew * 255)));
			filteredSignal[idx + 1] = Math.max(
				0,
				Math.min(255, Math.round(gNew * 255)),
			);
			filteredSignal[idx + 2] = Math.max(
				0,
				Math.min(255, Math.round(bNew * 255)),
			);
			filteredSignal[idx + 3] = signal[idx + 3]; // Alpha канал без изменений
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
	radius: number,
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

// [!SECTION/> !Видеосигнал
