import { DEBUG } from "@/features/constants";
import { cloneFloat32Array } from "../utils/audio-processing";
import { fft, Complex, ifft } from "../utils/fft";
import { debugLog } from "../utils/metrics";
import { hannWindow, binProps, createSpectrum } from "../utils/stft";

const MIN_GAIN = 0.3;
const HMM_VIDEO_BENCHMARK_MODE = false;

export async function hmmDenoise(
	signal: Float32Array[],
	relativeNoiseLevel: number,
	width?: number,
	height?: number
): Promise<Float32Array[]>;

export async function hmmDenoise(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width: number,
	height: number
): Promise<Uint8ClampedArray>;

export async function hmmDenoise(
	signal: Float32Array[] | Uint8ClampedArray,
	relativeNoiseLevel: number,
	width?: number,
	height?: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioHmmFilter(
			signal,
			computeHmmAudioVariance(signal, relativeNoiseLevel)
		);
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageHmmFilter(
			signal,
			computeHmmImageVariance(signal, relativeNoiseLevel, width, height),
			width,
			height
		);

	return signal;
}

const LOG_LIK_MIN = -50;
const LOG_LIK_MAX = 50;
const LOG_DIFF_MIN = -5;
const LOG_DIFF_MAX = 5;

// [SECTION/> Аудио

function audioHmmFilter(
	signal: Float32Array[],
	noiseVariance: number
): Float32Array[] {
	return stft(signal, noiseVariance);
}

function stft(signal: Float32Array[], noiseVariance: number): Float32Array[] {
	const frameSize = 512;
	const hopSize = Math.floor(frameSize / 2);
	const pad = Math.floor(frameSize / 2);

	return signal.map((channel) => {
		const size = channel.length;
		const data = cloneFloat32Array(channel);

		const paddedSize = size + pad * 2;
		const padded = new Float32Array(paddedSize);
		padded.set(data, pad);

		const windowSum = new Float32Array(paddedSize);
		const result = new Float32Array(paddedSize);

		const hmmState = createHMMState(hopSize + 1);

		const numFrames = Math.ceil((paddedSize - frameSize) / hopSize) + 1;

		for (let i = 0; i < numFrames; i++) {
			const start = i * hopSize;

			const frame = new Float32Array(frameSize);

			for (let j = 0; j < frameSize; j++) {
				const idx = start + j;
				const w = hannWindow(j, frameSize);

				if (idx < paddedSize) {
					frame[j] = padded[idx] * w;
					windowSum[idx] += w * w;
				} else {
					frame[j] = 0;
				}
			}

			const spectrum = fft(frame);
			const { amplitude, phase } = binProps(spectrum);

			const params = estimateHMMParams(amplitude, noiseVariance);
			const filteredAmplitude = viterbiStep(amplitude, params, hmmState);

			const filteredSpectrum: Complex[] = createSpectrum(
				filteredAmplitude,
				phase
			);

			const timeFrame = ifft(filteredSpectrum);

			for (let j = 0; j < frameSize; j++) {
				const idx = start + j;

				if (idx < paddedSize) {
					const w = hannWindow(j, frameSize);
					result[idx] += timeFrame[j] * w;
				}
			}
		}

		for (let i = 0; i < paddedSize; i++) {
			const norm = Math.max(windowSum[i], 1e-8);
			result[i] /= norm;
		}

		return result.slice(pad, pad + size);
	});
}

interface HMMState {
	delta: Float32Array[];
	initialized: boolean;
}

function createHMMState(numBins: number): HMMState {
	return {
		delta: [
			new Float32Array(numBins).fill(0),
			new Float32Array(numBins).fill(0),
		],
		initialized: false,
	};
}

function viterbiStep(
	amplitude: Float32Array,
	params: ReturnType<typeof estimateHMMParams>,
	hmmState: HMMState,
	transitionProb: number = 0.9
): Float32Array {
	const N = amplitude.length;
	const numBins = Math.floor(N / 2) + 1;
	const filteredAmp = new Float32Array(N);

	const logStay = Math.log(transitionProb);
	const logSwitch = Math.log(1 - transitionProb);

	for (let k = 0; k < numBins; k++) {
		const amp = amplitude[k];

		const logLikNoise = gaussianLogLikelihood(
			amp,
			params.muNoise,
			params.varNoise
		);
		const logLikSignal = gaussianLogLikelihood(
			amp,
			params.muSignal,
			params.varSignal
		);

		const clampedLogLikNoise = Math.max(
			LOG_LIK_MIN,
			Math.min(LOG_LIK_MAX, logLikNoise)
		);
		const clampedLogLikSignal = Math.max(
			LOG_LIK_MIN,
			Math.min(LOG_LIK_MAX, logLikSignal)
		);

		const deltaNoisePrev = hmmState.initialized ? hmmState.delta[0][k] : 0;
		const deltaSignalPrev = hmmState.initialized ? hmmState.delta[1][k] : 0;

		const deltaNoise =
			Math.max(deltaNoisePrev + logStay, deltaSignalPrev + logSwitch) +
			clampedLogLikNoise;

		const deltaSignal =
			Math.max(deltaNoisePrev + logSwitch, deltaSignalPrev + logStay) +
			clampedLogLikSignal;

		let logDiff = deltaSignal - deltaNoise;
		logDiff = Math.max(LOG_DIFF_MIN, Math.min(LOG_DIFF_MAX, logDiff));

		const probSignal = 1 / (1 + Math.exp(-logDiff));

		const gain = MIN_GAIN + (1 - MIN_GAIN) * probSignal;
		filteredAmp[k] = amp * gain;

		hmmState.delta[0][k] = deltaNoise;
		hmmState.delta[1][k] = deltaSignal;
	}

	hmmState.initialized = true;

	for (let k = 1; k < N - numBins + 1; k++) {
		filteredAmp[N - k] = filteredAmp[k];
	}

	return filteredAmp;
}

// [!SECTION/> !Аудио

// [SECTION/> Изображение

function gaussianLogLikelihood(
	x: number,
	mu: number,
	variance: number
): number {
	if (variance <= 0 || !isFinite(variance)) return -Infinity;
	if (!isFinite(x) || !isFinite(mu)) return -Infinity;

	const diff = x - mu;
	if (!isFinite(diff)) return -Infinity;

	const logCoeff = -0.5 * Math.log(2 * Math.PI * variance);
	const logExp = (-0.5 * diff * diff) / variance;

	const result = logCoeff + logExp;
	return isFinite(result) ? result : -Infinity;
}

function imageHmmFilter(
	signal: Uint8ClampedArray,
	noiseVariance: number,
	width: number,
	height: number
): Uint8ClampedArray {
	const blockSize = 8;
	const blocksX = Math.ceil(width / blockSize);
	const blocksY = Math.ceil(height / blockSize);

	const features = new Float32Array(blocksX * blocksY);
	const blockMap: { x: number; y: number }[] = [];

	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			const idx = by * blocksX + bx;
			blockMap.push({ x: bx, y: by });

			let sum = 0;
			let count = 0;
			for (let dy = 0; dy < blockSize; dy++) {
				for (let dx = 0; dx < blockSize; dx++) {
					const px = bx * blockSize + dx;
					const py = by * blockSize + dy;
					if (px < width && py < height) {
						const offset = (py * width + px) * 4;
						const r = signal[offset];
						const g = signal[offset + 1];
						const b = signal[offset + 2];
						const y = 0.299 * r + 0.587 * g + 0.114 * b;
						sum += y;
						count++;
					}
				}
			}
			features[idx] = count > 0 ? sum / count : 0;
		}
	}

	const maxFeature = 255;
	const normalizedFeatures = features.map((x) => x / maxFeature);
	const normalizedNoiseVariance = noiseVariance / (maxFeature * maxFeature);

	const filteredFeatures = apply2DHMM(
		normalizedFeatures,
		blocksX,
		blocksY,
		normalizedNoiseVariance,
		0.9,
		MIN_GAIN
	);

	if (DEBUG) {
		const avgOriginal = features.reduce((a, b) => a + b, 0) / features.length;
		const avgFilteredNormalized =
			filteredFeatures.reduce((a, b) => a + b, 0) / filteredFeatures.length;
		const avgFiltered = avgFilteredNormalized * 255;

		debugLog("HMM-Video", "Feature change", {
			avgOriginal,
			avgFiltered,
			relativeChange: Math.abs(avgFiltered - avgOriginal) / avgOriginal,
		});
	}

	const result = new Uint8ClampedArray(signal.length);
	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			const idx = by * blocksX + bx;
			const targetMean = filteredFeatures[idx];
			const targetMeanUint8 = targetMean * 255;

			for (let dy = 0; dy < blockSize; dy++) {
				for (let dx = 0; dx < blockSize; dx++) {
					const px = bx * blockSize + dx;
					const py = by * blockSize + dy;
					if (px < width && py < height) {
						const offset = (py * width + px) * 4;

						const currentY =
							0.299 * signal[offset] +
							0.587 * signal[offset + 1] +
							0.114 * signal[offset + 2];
						const targetY = targetMeanUint8;

						const yDiff = targetY - currentY;

						if (HMM_VIDEO_BENCHMARK_MODE) {
							const scale = currentY > 1e-6 ? targetY / currentY : 1;
							const clampedScale = Math.max(0.7, Math.min(1.5, scale));
							result[offset] = Math.max(
								0,
								Math.min(255, Math.round(signal[offset] * clampedScale))
							);
							result[offset + 1] = Math.max(
								0,
								Math.min(255, Math.round(signal[offset + 1] * clampedScale))
							);
							result[offset + 2] = Math.max(
								0,
								Math.min(255, Math.round(signal[offset + 2] * clampedScale))
							);
						} else {
							const maxChange = 30;
							const clampedDiff = Math.max(
								-maxChange,
								Math.min(maxChange, yDiff)
							);

							result[offset] = Math.max(
								0,
								Math.min(255, signal[offset] + clampedDiff * 0.299)
							);
							result[offset + 1] = Math.max(
								0,
								Math.min(255, signal[offset + 1] + clampedDiff * 0.587)
							);
							result[offset + 2] = Math.max(
								0,
								Math.min(255, signal[offset + 2] + clampedDiff * 0.114)
							);
							result[offset + 3] = signal[offset + 3];
						}
					}
				}
			}
		}
	}

	return result;
}

function apply2DHMM(
	features: Float32Array,
	blocksX: number,
	blocksY: number,
	noiseVariance: number,
	transitionProb: number = 0.9,
	minGain: number = 0.1
): Float32Array {
	const totalBlocks = blocksX * blocksY;
	const filtered = new Float32Array(totalBlocks);

	const params = estimateHMMParams(features, noiseVariance, true);

	const delta: Float32Array[] = [
		new Float32Array(totalBlocks).fill(-Infinity),
		new Float32Array(totalBlocks).fill(-Infinity),
	];

	const logStay = Math.log(transitionProb);
	const logSwitch = Math.log(1 - transitionProb);

	for (let d = 0; d < blocksX + blocksY - 1; d++) {
		for (let by = 0; by < blocksY; by++) {
			const bx = d - by;
			if (bx < 0 || bx >= blocksX) continue;

			const idx = by * blocksX + bx;
			const amp = features[idx];

			const logLikNoise = gaussianLogLikelihood(
				amp,
				params.muNoise,
				params.varNoise
			);
			const logLikSignal = gaussianLogLikelihood(
				amp,
				params.muSignal,
				params.varSignal
			);

			const clampedLogLikNoise = Math.max(
				LOG_LIK_MIN,
				Math.min(LOG_LIK_MAX, logLikNoise)
			);
			const clampedLogLikSignal = Math.max(
				LOG_LIK_MIN,
				Math.min(LOG_LIK_MAX, logLikSignal)
			);

			const topIdx = (by - 1) * blocksX + bx;
			const leftIdx = by * blocksX + (bx - 1);

			let bestDeltaNoise = -Infinity;
			let bestDeltaSignal = -Infinity;

			if (by > 0) {
				bestDeltaNoise = Math.max(
					bestDeltaNoise,
					delta[0][topIdx] + logStay,
					delta[1][topIdx] + logSwitch
				);
				bestDeltaSignal = Math.max(
					bestDeltaSignal,
					delta[1][topIdx] + logStay,
					delta[0][topIdx] + logSwitch
				);
			}

			if (bx > 0) {
				bestDeltaNoise = Math.max(
					bestDeltaNoise,
					delta[0][leftIdx] + logStay,
					delta[1][leftIdx] + logSwitch
				);
				bestDeltaSignal = Math.max(
					bestDeltaSignal,
					delta[1][leftIdx] + logStay,
					delta[0][leftIdx] + logSwitch
				);
			}

			if (by === 0 && bx === 0) {
				bestDeltaNoise = 0;
				bestDeltaSignal = 0;
			}

			delta[0][idx] = bestDeltaNoise + clampedLogLikNoise;
			delta[1][idx] = bestDeltaSignal + clampedLogLikSignal;

			const logDiff = delta[1][idx] - delta[0][idx];
			const clampedLogDiff = Math.max(
				LOG_DIFF_MIN,
				Math.min(LOG_DIFF_MAX, logDiff)
			);
			const probSignal = 1 / (1 + Math.exp(-clampedLogDiff));

			const gain = minGain + (1 - minGain) * probSignal;
			filtered[idx] = amp * gain;
		}
	}

	return filtered;
}

// [!SECTION/> !Изображение

// [SECTION/> Вспомогательные функции

function computeHmmAudioVariance(
	signal: Float32Array | Float32Array[],
	relativeNoiseLevel: number
): number {
	const channels = Array.isArray(signal) ? signal : [signal as Float32Array];
	const frameSize = 512;
	const hopSize = Math.floor(frameSize / 2);

	const spectrumSamples: number[] = [];

	for (const ch of channels) {
		const numFrames = Math.max(
			1,
			Math.floor((ch.length - frameSize) / hopSize) + 1
		);
		for (let f = 0; f < numFrames; f++) {
			const start = f * hopSize;
			const frame = new Float32Array(frameSize);

			for (let j = 0; j < frameSize && start + j < ch.length; j++) {
				frame[j] = ch[start + j] * hannWindow(j, frameSize);
			}

			const spectrum = fft(frame);
			const { amplitude } = binProps(spectrum);

			for (let k = 0; k < amplitude.length / 2; k++) {
				spectrumSamples.push(amplitude[k]);
			}
		}
	}

	const n = spectrumSamples.length;
	if (n === 0) return 1e-10;

	const signalPower = spectrumSamples.reduce((s, x) => s + x * x, 0) / n;
	const noiseVariance = signalPower * Math.pow(10, relativeNoiseLevel / 10);

	return Math.max(noiseVariance, 1e-10);
}

function computeHmmImageVariance(
	signal: Uint8ClampedArray,
	relativeNoiseLevel: number,
	width: number,
	height: number
): number {
	const blockSize = 8;
	const blocksX = Math.ceil(width / blockSize);
	const blocksY = Math.ceil(height / blockSize);

	const blockFeatures: number[] = [];

	for (let by = 0; by < blocksY; by++) {
		for (let bx = 0; bx < blocksX; bx++) {
			let sumY = 0,
				count = 0;
			for (let dy = 0; dy < blockSize; dy++) {
				for (let dx = 0; dx < blockSize; dx++) {
					const px = bx * blockSize + dx;
					const py = by * blockSize + dy;
					if (px < width && py < height) {
						const offset = (py * width + px) * 4;
						const y =
							0.299 * signal[offset] +
							0.587 * signal[offset + 1] +
							0.114 * signal[offset + 2];
						sumY += y;
						count++;
					}
				}
			}
			blockFeatures.push(count > 0 ? sumY / count : 0);
		}
	}

	const n = blockFeatures.length;
	if (n === 0) return 1e-10;

	const mean = blockFeatures.reduce((s, x) => s + x, 0) / n;
	const varianceRaw =
		blockFeatures.reduce((s, x) => s + (x - mean) ** 2, 0) / n;

	const normalizedVariance = varianceRaw / (255 * 255);
	const noiseVariance =
		normalizedVariance * Math.pow(10, relativeNoiseLevel / 10);

	if (DEBUG)
		debugLog("HMM-Video", "Variance scale", {
			raw: varianceRaw,
			normalized: normalizedVariance,
			noiseVariance,
			relativeNoiseLevel,
		});

	return Math.max(noiseVariance, 1e-10);
}

function estimateHMMParams(
	values: Float32Array | number[],
	noiseVariance: number,
	isImage: boolean = false
) {
	const arr = Array.from(values);
	arr.sort((a, b) => a - b);
	const N = arr.length;

	const noiseCount = Math.max(10, Math.floor(N * 0.3));
	const noiseValues = arr.slice(0, noiseCount);
	const muNoise = noiseValues.reduce((s, x) => s + x, 0) / noiseCount;

	const noiseDeviations = noiseValues.map((x) => Math.abs(x - muNoise));
	noiseDeviations.sort((a, b) => a - b);
	const medianDevNoise =
		noiseDeviations[Math.floor(noiseDeviations.length / 2)];
	const varNoise = Math.max(
		(medianDevNoise / 0.6745) ** 2,
		noiseVariance,
		1e-10
	);

	const signalCount = Math.max(10, Math.floor(N * 0.15));
	const signalValues = arr.slice(-signalCount);
	const muSignal = signalValues.reduce((s, x) => s + x, 0) / signalCount;

	const signalDeviations = signalValues.map((x) => Math.abs(x - muSignal));
	signalDeviations.sort((a, b) => a - b);
	const medianDevSignal =
		signalDeviations[Math.floor(signalDeviations.length / 2)];
	const varSignal = Math.max(
		(medianDevSignal / 0.6745) ** 2,
		varNoise * 1.5,
		1e-10
	);

	return {
		muNoise: isImage
			? Math.max(1e-4, Math.min(muNoise, 0.9))
			: Math.max(1e-4, muNoise),
		varNoise: isImage
			? Math.max(1e-8, Math.min(varNoise, 0.5))
			: Math.min(varNoise, 1.0),
		muSignal: isImage
			? Math.max(muNoise + 0.1, Math.min(muSignal, 1.0))
			: Math.max(muNoise + 0.05, muSignal),
		varSignal: isImage
			? Math.max(varNoise * 2, Math.min(varSignal, 1.0))
			: Math.min(varSignal, 2.0),
	};
}

// [!SECTION/> !Вспомогательные функции
