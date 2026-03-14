import { DEBUG } from "@/features/constants";
import { fft, Complex } from "./fft";

export function debugLog(module: string, message: string, data?: unknown) {
	if (!DEBUG) return;
	const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
	console.log(
		`[${timestamp}] [${module}] ${message}`,
		data !== undefined ? data : ""
	);
}

export interface AudioMetrics {
	snr: number;
	stoi: number;
	pesq: number;
}

export interface VideoMetrics {
	psnr: number;
	ssim: number;
	msSsim: number;
}

export interface DenoisingMetrics<T> {
	original: T;
	noisy: T;
	denoised: T;
	metricsBefore: AudioMetrics | VideoMetrics;
	metricsAfter: AudioMetrics | VideoMetrics;
	improvement: {
		[key: string]: number;
	};
}

// [SECTION/> АУДИО МЕТРИКИ

export function calculateAudioMetrics(
	original: Float32Array[],
	noisy: Float32Array[],
	denoised: Float32Array[]
): {
	before: AudioMetrics;
	after: AudioMetrics;
	improvement: { [key: string]: number };
} {
	const before: AudioMetrics = {
		snr: calculateSNR(original, noisy),
		stoi: calculateSTOI(original, noisy),
		pesq: calculatePESQ(original, noisy),
	};

	const after: AudioMetrics = {
		snr: calculateSNR(original, denoised),
		stoi: calculateSTOI(original, denoised),
		pesq: calculatePESQ(original, denoised),
	};

	const improvement = {
		ΔSNR: after.snr - before.snr,
		ΔSTOI:
			before.stoi > 1e-10
				? ((after.stoi - before.stoi) / before.stoi) * 100
				: (after.stoi - before.stoi) * 100,
		ΔPESQ: after.pesq - before.pesq,
	};

	if (DEBUG) {
		let maxDiff = 0,
			meanDiff = 0;
		for (let ch = 0; ch < original.length; ch++) {
			for (let i = 0; i < original[ch].length; i++) {
				const diff = Math.abs(original[ch][i] - denoised[ch][i]);
				maxDiff = Math.max(maxDiff, diff);
				meanDiff += diff;
			}
		}
		meanDiff /= original[0].length * original.length;
		debugLog("AudioMetrics", "Denoised vs Original", { maxDiff, meanDiff });
	}

	return { before, after, improvement };
}

// [ANCHOR/> SNR
export function calculateSNR(
	original: Float32Array[],
	noisy: Float32Array[]
): number {
	debugLog("SNR", "Start calculation", { channels: original.length });

	let signalPower = 0;
	let noisePower = 0;
	let count = 0;

	for (let ch = 0; ch < original.length; ch++) {
		for (let i = 0; i < original[ch].length; i++) {
			const signal = original[ch][i];
			const noise = noisy[ch][i] - signal;

			signalPower += signal * signal;
			noisePower += noise * noise;
			count++;
		}
	}

	if (noisePower < 1e-10) return 100;

	const snr = 10 * Math.log10(signalPower / noisePower);

	debugLog("SNR", "Complete", { snr: snr });
	debugLog("SNR", "Signal power", { signalPower });
	debugLog("SNR", "Noise power", { noisePower });
	debugLog("SNR", "Comparison", {
		originalRms: Math.sqrt(signalPower / count),
		noisyRms: Math.sqrt(noisePower / count),
	});

	return isFinite(snr) ? snr : 0;
}

// [ANCHOR/> STOI
export function calculateSTOI(
	original: Float32Array[],
	processed: Float32Array[],
	sampleRate: number = 16000
): number {
	debugLog("STOI", "Start", {
		sampleRate,
		originalChannels: original.length,
		processedChannels: processed.length,
	});

	let num = 0,
		denOrig = 0,
		denProc = 0;
	let meanOrig = 0,
		meanProc = 0;
	let totalSamples = 0;

	const numChannels = Math.min(original.length, processed.length);
	if (numChannels === 0) {
		debugLog("STOI", "No channels to process");
		return 0;
	}

	for (let ch = 0; ch < numChannels; ch++) {
		const origCh = original[ch];
		const procCh = processed[ch];
		const len = Math.min(origCh.length, procCh.length);

		for (let i = 0; i < len; i++) {
			meanOrig += origCh[i];
			meanProc += procCh[i];
			totalSamples++;
		}
	}

	if (totalSamples === 0) {
		debugLog("STOI", "No samples");
		return 0;
	}

	meanOrig /= totalSamples;
	meanProc /= totalSamples;

	for (let ch = 0; ch < numChannels; ch++) {
		const origCh = original[ch];
		const procCh = processed[ch];
		const len = Math.min(origCh.length, procCh.length);

		for (let i = 0; i < len; i++) {
			const dOrig = origCh[i] - meanOrig;
			const dProc = procCh[i] - meanProc;
			num += dOrig * dProc;
			denOrig += dOrig * dOrig;
			denProc += dProc * dProc;
		}
	}

	const denom = Math.sqrt(denOrig * denProc);
	const corr = denom > 1e-10 ? num / denom : 0;
	const stoi = (Math.max(-1, Math.min(1, corr)) + 1) / 2;

	debugLog("STOI", "Complete", { stoi, correlation: corr });
	return stoi;
}

// [ANCHOR/> PSEQ
export function calculatePESQ(
	original: Float32Array[],
	processed: Float32Array[]
): number {
	debugLog("PESQ", "Start approximation");
	const snr = calculateSNR(original, processed);
	debugLog("PESQ", "SNR component", { snr });

	let spectralDist = 0;
	let count = 0;

	for (let ch = 0; ch < original.length; ch++) {
		const clean = original[ch];
		const proc = processed[ch];
		const frameSize = 512;
		const hopSize = 256;

		for (let i = 0; i < clean.length - frameSize; i += hopSize) {
			const cleanFrame = clean.slice(i, i + frameSize);
			const procFrame = proc.slice(i, i + frameSize);

			const cleanSpec = fft(cleanFrame);
			const procSpec = fft(procFrame);

			for (let k = 0; k < cleanSpec.length; k++) {
				const magClean = complexMagnitude(cleanSpec[k]);
				const magProc = complexMagnitude(procSpec[k]);

				spectralDist += Math.abs(
					Math.log10(magClean + 1e-10) - Math.log10(magProc + 1e-10)
				);
				count++;
			}
		}
	}

	const avgSpectralDist = count > 0 ? spectralDist / count : 0;
	debugLog("PESQ", "Spectral distance", { avgSpectralDist });

	//  формула для аппроксимации PESQ
	const pesq = 4.5 - avgSpectralDist * 0.5 + snr / 50;
	const result = Math.max(-0.5, Math.min(4.5, pesq));

	debugLog("PESQ", "Complete", { pesq: result });
	return result;
}

// [!SECTION/>

// [SECTION/> ВИДЕО МЕТРИКИ

export function calculateVideoMetrics(
	original: Uint8ClampedArray,
	noisy: Uint8ClampedArray,
	denoised: Uint8ClampedArray,
	width: number,
	height: number
): {
	before: VideoMetrics;
	after: VideoMetrics;
	improvement: { [key: string]: number };
} {
	debugLog("VideoMetrics", "=== Starting evaluation ===", { width, height });

	const before: VideoMetrics = {
		psnr: calculatePSNR(original, noisy),
		ssim: calculateSSIM(original, noisy, width, height),
		msSsim: calculateMSSSIM(original, noisy, width, height),
	};
	debugLog("VideoMetrics", "Before", before);

	const after: VideoMetrics = {
		psnr: calculatePSNR(original, denoised),
		ssim: calculateSSIM(original, denoised, width, height),
		msSsim: calculateMSSSIM(original, denoised, width, height),
	};
	debugLog("VideoMetrics", "After", after);

	const improvement = {
		ΔPSNR: after.psnr - before.psnr,

		ΔSSIM:
			before.ssim > 1e-10
				? ((after.ssim - before.ssim) / before.ssim) * 100
				: (after.ssim - before.ssim) * 100, // абсолютное изменение, если до было ~0

		ΔMSSSIM:
			before.msSsim > 1e-10
				? ((after.msSsim - before.msSsim) / before.msSsim) * 100
				: (after.msSsim - before.msSsim) * 100,
	};
	debugLog("VideoMetrics", "Improvement", improvement);
	debugLog("VideoMetrics", "=== Complete ===\n");
	return { before, after, improvement };
}

// [ANCHOR/> PSNR
export function calculatePSNR(
	original: Uint8ClampedArray,
	processed: Uint8ClampedArray
): number {
	if (original.length !== processed.length) {
		throw new Error("Arrays must have the same length");
	}
	if (DEBUG) {
		console.log(`[PSNR] Start: ${original.length} bytes`);
	}

	let mse = 0;
	const maxVal = 255;
	const channels = 4;

	for (let i = 0; i < original.length; i += channels) {
		for (let c = 0; c < 3; c++) {
			const diff = original[i + c] - processed[i + c];
			mse += diff * diff;
		}
	}

	const numPixels = (original.length / channels) * 3;
	mse /= numPixels;

	if (mse < 1e-10) return 100;

	const psnr = 10 * Math.log10((maxVal * maxVal) / mse);
	const result = isFinite(psnr) ? psnr : 0;

	debugLog("PSNR", "Complete", { psnr: result });
	return result;
}

// [ANCHOR/> SSIM
export function calculateSSIM(
	original: Uint8ClampedArray,
	processed: Uint8ClampedArray,
	width: number,
	height: number,
	windowSize: number = 11
): number {
	console.log(`[SSIM] Start: ${width}×${height}, window=${windowSize}`);

	const channels = 4;
	const C1 = (0.01 * 255) ** 2;
	const C2 = (0.03 * 255) ** 2;

	let ssimSum = 0;
	let count = 0;
	const totalWindows = (width - windowSize) * (height - windowSize);
	let processedWindows = 0;

	const actualWindowSize = Math.min(windowSize, Math.min(width, height) - 2);
	if (actualWindowSize < 3) {
		return calculateSimpleSimilarity(original, processed, width, height);
	}
	const halfWin = Math.floor(actualWindowSize / 2);

	for (let y = halfWin; y < height - halfWin; y++) {
		for (let x = halfWin; x < width - halfWin; x++) {
			processedWindows++;
			if (DEBUG && processedWindows % Math.floor(totalWindows / 10) === 0) {
				const percent = Math.round((processedWindows / totalWindows) * 100);
				console.log(`[SSIM] Progress: ${percent}%`);
			}

			const windowOrig: number[] = [];
			const windowProc: number[] = [];

			for (let wy = -halfWin; wy <= halfWin; wy++) {
				for (let wx = -halfWin; wx <= halfWin; wx++) {
					const idx = ((y + wy) * width + (x + wx)) * channels;

					const yOrig =
						0.299 * original[idx] +
						0.587 * original[idx + 1] +
						0.114 * original[idx + 2];
					const yProc =
						0.299 * processed[idx] +
						0.587 * processed[idx + 1] +
						0.114 * processed[idx + 2];

					windowOrig.push(yOrig);
					windowProc.push(yProc);
				}
			}

			const meanOrig =
				windowOrig.reduce((a, b) => a + b, 0) / windowOrig.length;
			const meanProc =
				windowProc.reduce((a, b) => a + b, 0) / windowProc.length;

			let varOrig = 0,
				varProc = 0,
				covar = 0;
			for (let i = 0; i < windowOrig.length; i++) {
				const dOrig = windowOrig[i] - meanOrig;
				const dProc = windowProc[i] - meanProc;
				varOrig += dOrig * dOrig;
				varProc += dProc * dProc;
				covar += dOrig * dProc;
			}
			varOrig /= windowOrig.length;
			varProc /= windowProc.length;
			covar /= windowOrig.length;

			const num = (2 * meanOrig * meanProc + C1) * (2 * covar + C2);
			const den =
				(meanOrig ** 2 + meanProc ** 2 + C1) * (varOrig + varProc + C2);

			const ssim = num / den;
			if (isFinite(ssim)) {
				ssimSum += ssim;
				count++;
			}
		}
	}
	const result = count > 0 ? ssimSum / count : 0;

	debugLog("SSIM", "Complete", { ssim: result, windows: count });
	return result;
}

function calculateSimpleSimilarity(
	orig: Uint8ClampedArray,
	proc: Uint8ClampedArray,
	width: number,
	height: number
): number {
	let match = 0;
	for (let i = 0; i < orig.length; i += 4) {
		const yOrig = 0.299 * orig[i] + 0.587 * orig[i + 1] + 0.114 * orig[i + 2];
		const yProc = 0.299 * proc[i] + 0.587 * proc[i + 1] + 0.114 * proc[i + 2];
		if (Math.abs(yOrig - yProc) < 10) match++;
	}
	return match / (width * height);
}

export function calculateMSSSIM(
	original: Uint8ClampedArray,
	processed: Uint8ClampedArray,
	width: number,
	height: number,
	numScales: number = 5
): number {
	const weights = [0.0448, 0.2856, 0.3001, 0.2363, 0.1333].slice(0, numScales);

	let msSsim = 1;
	let currWidth = width;
	let currHeight = height;
	let currOrig = original;
	let currProc = processed;

	for (let scale = 0; scale < numScales; scale++) {
		const ssim = calculateSSIM(currOrig, currProc, currWidth, currHeight);

		if (scale < numScales - 1) {
			const nextWidth = Math.floor(currWidth / 2);
			const nextHeight = Math.floor(currHeight / 2);
			const nextOrig = new Uint8ClampedArray(nextWidth * nextHeight * 4);
			const nextProc = new Uint8ClampedArray(nextWidth * nextHeight * 4);

			for (let y = 0; y < nextHeight; y++) {
				for (let x = 0; x < nextWidth; x++) {
					for (let c = 0; c < 4; c++) {
						const idx = (y * currWidth + x) * 4 + c;
						const val =
							(currOrig[idx] +
								currOrig[idx + 4] +
								currOrig[idx + currWidth * 4] +
								currOrig[idx + currWidth * 4 + 4]) /
							4;
						nextOrig[(y * nextWidth + x) * 4 + c] = val;

						const valProc =
							(currProc[idx] +
								currProc[idx + 4] +
								currProc[idx + currWidth * 4] +
								currProc[idx + currWidth * 4 + 4]) /
							4;
						nextProc[(y * nextWidth + x) * 4 + c] = valProc;
					}
				}
			}

			currWidth = nextWidth;
			currHeight = nextHeight;
			currOrig = nextOrig;
			currProc = nextProc;
		}

		msSsim *= Math.pow(ssim, weights[scale]);
	}

	return msSsim;
}

// [!SECTION/>

// [SECTION/> ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ FFT

export function complexMagnitude(c: Complex): number {
	return (c.re + c.im) ** 0.5;
}

// [!SECTION/>

// [SECTION/> СТАТИСТИЧЕСКАЯ ОБРАБОТКА

export interface StatisticalSummary {
	mean: number;
	stdDev: number;
	min: number;
	max: number;
	confidenceInterval95: [number, number];
}

export function calculateStatistics(values: number[]): StatisticalSummary {
	if (values.length === 0) {
		return {
			mean: 0,
			stdDev: 0,
			min: 0,
			max: 0,
			confidenceInterval95: [0, 0],
		};
	}
	debugLog("Stats", "Calculating for", { count: values.length });

	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const variance =
		values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
	const stdDev = Math.sqrt(variance);

	const sorted = [...values].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];

	const tValue = 1.96;
	const marginOfError = tValue * (stdDev / Math.sqrt(values.length));

	const summary: StatisticalSummary = {
		mean,
		stdDev,
		min,
		max,
		confidenceInterval95: [mean - marginOfError, mean + marginOfError],
	};
	debugLog("Stats", "Result", summary);
	return summary;
}

export function aggregateResults(
	results: Array<{ improvement: { [key: string]: number } }>
): { [metric: string]: StatisticalSummary } {
	if (results.length === 0) return {};

	const allMetrics = new Set<string>();
	for (const r of results) {
		for (const key of Object.keys(r.improvement)) {
			allMetrics.add(key);
		}
	}

	const aggregated: { [metric: string]: number[] } = {};
	for (const metric of allMetrics) {
		aggregated[metric] = [];
	}

	for (const result of results) {
		for (const metric of allMetrics) {
			const val = result.improvement[metric];
			if (val !== undefined && isFinite(val)) {
				aggregated[metric].push(val);
			}
		}
	}

	const summary: { [metric: string]: StatisticalSummary } = {};
	for (const metric of allMetrics) {
		if (aggregated[metric].length > 0) {
			summary[metric] = calculateStatistics(aggregated[metric]);
		}
	}

	return summary;
}

// [!SECTION/>
