import { cloneFloat32Array } from "../audio-processing";
import { fft, Complex, ifft } from "../fft";
import { binProps, createSpectrum, hannWindow } from "../stft";

export async function hmmDenoise(
	signal: Float32Array[],
	noiseVariance: number,
	width?: number,
	height?: number
): Promise<Float32Array[]>;

export async function hmmDenoise(
	signal: Uint8ClampedArray,
	noiseVariance: number
): Promise<Uint8ClampedArray>;

export async function hmmDenoise(
	signal: Float32Array[] | Uint8ClampedArray,
	noiseVariance: number,
	width?: number,
	height?: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	console.log("noiseVariance: ", noiseVariance);

	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioHmmFilter(signal, noiseVariance);
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageHmmFilter(signal, noiseVariance, width, height);

	return signal;
}

// [SECTION/> Аудио

function audioHmmFilter(
	signal: Float32Array[],
	noiseVariance: number
): Float32Array[] {
	return stft(signal, noiseVariance);
}

export function stft(
	signal: Float32Array[],
	noiseVariance: number
): Float32Array[] {
	const frameSize = 512;
	const hopSize = Math.floor(frameSize / 2);

	return signal.map((channel) => {
		const hmmState = createHMMState(hopSize + 1);

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

			const params = estimateHMMParameters(amplitude, noiseVariance);
			const filteredAmplitude = viterbiStep(amplitude, params, hmmState);

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

function estimateHMMParameters(amplitude: Float32Array, noiseVariance: number) {
	const N = amplitude.length;

	const noiseStd = Math.sqrt(noiseVariance);
	const muNoise = noiseStd * 0.8;
	const varNoise = noiseVariance;

	const sortedAmp = Array.from(amplitude).sort((a, b) => b - a);
	const signalCount = Math.max(1, Math.floor(N * 0.2));
	const signalAmps = sortedAmp.slice(0, signalCount);

	const muSignal = signalAmps.reduce((s, x) => s + x, 0) / signalCount;
	const rawVarSignal =
		signalAmps.reduce((s, x) => s + (x - muSignal) ** 2, 0) / signalCount;

	const varSignal = Math.max(rawVarSignal, varNoise * 8, 1e-10);

	return {
		muNoise,
		varNoise,
		muSignal,
		varSignal,
	};
}

function viterbiStep(
	amplitude: Float32Array,
	params: ReturnType<typeof estimateHMMParameters>,
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

		const deltaNoisePrev = hmmState.initialized ? hmmState.delta[0][k] : 0;
		const deltaSignalPrev = hmmState.initialized ? hmmState.delta[1][k] : 0;

		const deltaNoise =
			Math.max(deltaNoisePrev + logStay, deltaSignalPrev + logSwitch) +
			logLikNoise;

		const deltaSignal =
			Math.max(deltaNoisePrev + logSwitch, deltaSignalPrev + logStay) +
			logLikSignal;

		const isSignal = deltaSignal > deltaNoise;

		filteredAmp[k] = isSignal ? amp : amp * 0.1;
		hmmState.delta[0][k] = deltaNoise;
		hmmState.delta[1][k] = deltaSignal;
	}

	hmmState.initialized = true;

	for (let k = 1; k < numBins - 1; k++) {
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
	if (variance <= 0) return -Infinity;

	const logCoeff = -0.5 * Math.log(2 * Math.PI * variance);
	const logExp = (-0.5 * (x - mu) ** 2) / variance;

	return logCoeff + logExp;
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
	const normalizedNoiseVariance = noiseVariance / (maxFeature * maxFeature); // variance в [0,1]²

	const filteredFeatures = apply2DHMM(
		normalizedFeatures,
		blocksX,
		blocksY,
		normalizedNoiseVariance
	);

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

						const currentYUint8 = currentY;
						const scale =
							targetMeanUint8 > 1e-3 ? currentYUint8 / targetMeanUint8 : 1;

						const attenuation = 0.2;
						let gain = scale > 1 ? 1 : scale + attenuation * (1 - scale);
						if (targetMean < 0.05) gain = 0.1;

						const diff = currentYUint8 - targetMeanUint8;
						const correctedY = targetMeanUint8 + diff * attenuation;

						const rFactor = 0.299 / (0.299 + 0.587 + 0.114);
						const gFactor = 0.587 / 1.0;
						const bFactor = 0.114 / 1.0;

						result[offset] = Math.min(
							255,
							Math.max(
								0,
								signal[offset] + (correctedY - currentYUint8) * rFactor
							)
						);
						result[offset + 1] = Math.min(
							255,
							Math.max(
								0,
								signal[offset + 1] + (correctedY - currentYUint8) * gFactor
							)
						);
						result[offset + 2] = Math.min(
							255,
							Math.max(
								0,
								signal[offset + 2] + (correctedY - currentYUint8) * bFactor
							)
						);
						result[offset + 3] = signal[offset + 3];
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
	noiseVariance: number
): Float32Array {
	const totalBlocks = blocksX * blocksY;
	const filtered = new Float32Array(totalBlocks);

	const params = estimateImageHMMParams(features, noiseVariance);

	const delta: Float32Array[] = [
		new Float32Array(totalBlocks).fill(0),
		new Float32Array(totalBlocks).fill(0),
	];

	const logStay = Math.log(0.9);
	const logSwitch = Math.log(0.1);

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

			const topIdx = (by - 1) * blocksX + bx;
			const leftIdx = by * blocksX + (bx - 1);

			let bestDeltaNoise = -Infinity;
			let bestDeltaSignal = -Infinity;

			if (by > 0) {
				bestDeltaNoise = Math.max(bestDeltaNoise, delta[0][topIdx] + logStay);
				bestDeltaSignal = Math.max(bestDeltaSignal, delta[1][topIdx] + logStay);
			}
			if (bx > 0) {
				bestDeltaNoise = Math.max(bestDeltaNoise, delta[0][leftIdx] + logStay);
				bestDeltaSignal = Math.max(
					bestDeltaSignal,
					delta[1][leftIdx] + logStay
				);
			}
			if (by > 0) {
				bestDeltaNoise = Math.max(bestDeltaNoise, delta[1][topIdx] + logSwitch);
				bestDeltaSignal = Math.max(
					bestDeltaSignal,
					delta[0][topIdx] + logSwitch
				);
			}
			if (bx > 0) {
				bestDeltaNoise = Math.max(
					bestDeltaNoise,
					delta[1][leftIdx] + logSwitch
				);
				bestDeltaSignal = Math.max(
					bestDeltaSignal,
					delta[0][leftIdx] + logSwitch
				);
			}

			if (by === 0 && bx === 0) {
				bestDeltaNoise = logLikNoise;
				bestDeltaSignal = logLikSignal;
			}

			delta[0][idx] = bestDeltaNoise + logLikNoise;
			delta[1][idx] = bestDeltaSignal + logLikSignal;

			const isSignal = delta[1][idx] > delta[0][idx];
			const gain = isSignal ? 1 : 0.2; // как в аудио
			filtered[idx] = amp * gain;
		}
	}

	return filtered;
}

function estimateImageHMMParams(features: Float32Array, noiseVariance: number) {
	const N = features.length;

	const noiseStd = Math.sqrt(noiseVariance);
	const muNoise = Math.max(1e-4, noiseStd * 0.8);
	const varNoise = Math.max(1e-8, noiseVariance);

	const sorted = Array.from(features).sort((a, b) => b - a);
	const signalCount = Math.max(1, Math.floor(N * 0.2));
	const signalAmps = sorted.slice(0, signalCount);

	const muSignal = signalAmps.reduce((s, x) => s + x, 0) / signalCount;
	const rawVarSignal =
		signalAmps.reduce((s, x) => s + (x - muSignal) ** 2, 0) / signalCount;
	const varSignal = Math.max(rawVarSignal, varNoise * 8);

	return { muNoise, varNoise, muSignal, varSignal };
}

// [!SECTION/> !Изображение
