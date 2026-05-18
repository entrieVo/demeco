import { DEBUG } from "./constants";
import { fft, Complex } from "./fft";

export function debugLog(module: string, message: string, data?: unknown) {
	if (!DEBUG) return;
	const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
	console.log(
		`[${timestamp}] [${module}] ${message}`,
		data !== undefined ? data : "",
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
	denoised: Float32Array[],
): {
	before: AudioMetrics;
	after: AudioMetrics;
	improvement: Record<string, number>;
} {
	const before: AudioMetrics = {
		snr: calculateSNR(original, noisy),
		stoi: calculateSTOI(original, noisy),
		pesq: calculatePESQApprox(original, noisy),
	};

	const after: AudioMetrics = {
		snr: calculateSNR(original, denoised),
		stoi: calculateSTOI(original, denoised),
		pesq: calculatePESQApprox(original, denoised),
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
	noisy: Float32Array[],
): number {
	debugLog("SNR", "Start calculation", { channels: original.length });

	if (original.length !== noisy.length) {
		throw new Error("SNR: Channel count mismatch");
	}

	let signalPower = 0;
	let noisePower = 0;
	let count = 0;

	for (let ch = 0; ch < original.length; ch++) {
		const origCh = original[ch];
		const noisyCh = noisy[ch];

		if (origCh.length !== noisyCh.length) {
			throw new Error(`SNR: Length mismatch in channel ${ch}`);
		}

		for (let i = 0; i < origCh.length; i++) {
			const signal = origCh[i];
			const noise = noisyCh[i] - signal;

			signalPower += signal * signal;
			noisePower += noise * noise;
			count++;
		}
	}

	const NOISE_FLOOR = 1e-10;
	const MAX_SNR_DB = 100;

	if (noisePower < NOISE_FLOOR) {
		debugLog("SNR", "Noise floor reached, capping SNR", { max: MAX_SNR_DB });
		return MAX_SNR_DB;
	}

	const snr = 10 * Math.log10(signalPower / noisePower);

	debugLog("SNR", "Complete", { snr });
	debugLog("SNR", "Signal power", { signalPower });
	debugLog("SNR", "Noise power", { noisePower });
	debugLog("SNR", "RMS check", {
		originalRms: Math.sqrt(signalPower / count),
		noisyRms: Math.sqrt(noisePower / count),
	});

	return isFinite(snr) ? snr : 0;
}

// [ANCHOR/> STOI
export function calculateSTOI(
	original: Float32Array[],
	processed: Float32Array[],
	sampleRate: number = 16000,
): number {
	// STOI разработан для монофонических сигналов с fs = 10 kHz
	const FS_REF = 10000;
	const FRAME_LEN = 256; // 25.6 мс при 10 кГц
	const HOP_LEN = 128; // 12.8 мс
	const NUM_BANDS = 15; // Количество 1/3-октавных полос
	const CORR_WIN_LEN = 15; // Длина окна корреляции (фреймы)

	// Границы 1/3-октавных полос (Гц) для fs=10 кГц
	const BAND_EDGES = [
		50, 157, 252, 362, 487, 630, 793, 978, 1187, 1424, 1693, 2000, 2351, 2750,
		3207, 3734, 4343, 5000,
	];

	// 1. ПРЕДВАРИТЕЛЬНАЯ ОБРАБОТКА
	const x = prepareSignal(original[0], sampleRate, FS_REF);
	const y = prepareSignal(processed[0], sampleRate, FS_REF);

	if (x.length !== y.length || x.length === 0) {
		console.warn("STOI: Signals length mismatch or empty after preprocessing.");
		return 0;
	}

	const N = x.length;
	const numFrames = Math.floor((N - FRAME_LEN) / HOP_LEN) + 1;

	// 2. ВЫЧИСЛЕНИЕ STFT И ЭНЕРГИЙ ПО ПОЛОСАМ
	const xBands = new Float32Array(NUM_BANDS * numFrames);
	const yBands = new Float32Array(NUM_BANDS * numFrames);

	// Предвычисление маппинга FFT бинов в октавные полосы
	const fftBinToBand = computeBandMapping(FRAME_LEN, FS_REF, BAND_EDGES);
	const window = new Float32Array(FRAME_LEN);
	for (let i = 0; i < FRAME_LEN; i++)
		window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FRAME_LEN - 1)));

	for (let m = 0; m < numFrames; m++) {
		const start = m * HOP_LEN;

		// Извлечение и взвешивание фрейма
		const xFrame = new Float32Array(FRAME_LEN);
		const yFrame = new Float32Array(FRAME_LEN);
		for (let i = 0; i < FRAME_LEN; i++) {
			xFrame[i] = x[start + i] * window[i];
			yFrame[i] = y[start + i] * window[i];
		}

		const xSpec = fft(xFrame);
		const ySpec = fft(yFrame);

		// Суммирование энергии по полосам
		for (let b = 0; b < NUM_BANDS; b++) {
			let xBandEnergy = 0;
			let yBandEnergy = 0;

			const [startBin, endBin] = fftBinToBand[b];
			for (let k = startBin; k <= endBin; k++) {
				xBandEnergy += xSpec[k].re * xSpec[k].re + xSpec[k].im * xSpec[k].im;
				yBandEnergy += ySpec[k].re * ySpec[k].re + ySpec[k].im * ySpec[k].im;
			}

			// Огибающая полосы = sqrt(средней энергии)
			xBands[b * numFrames + m] = Math.sqrt(
				xBandEnergy / (endBin - startBin + 1),
			);
			yBands[b * numFrames + m] = Math.sqrt(
				yBandEnergy / (endBin - startBin + 1),
			);
		}
	}

	// 3. ВЫЧИСЛЕНИЕ КОРРЕЛЯЦИЙ ПОЛОСНЫХ ОГИБАЮЩИХ
	const correlations: number[] = [];
	const halfWin = Math.floor(CORR_WIN_LEN / 2);

	for (let b = 0; b < NUM_BANDS; b++) {
		for (let m = 0; m < numFrames; m++) {
			// Границы окна корреляции
			const winStart = Math.max(0, m - halfWin);
			const winEnd = Math.min(numFrames - 1, m + halfWin);
			const winLen = winEnd - winStart + 1;

			// Векторы огибающих в окне
			const xEnv = new Float32Array(winLen);
			const yEnv = new Float32Array(winLen);

			let sumX = 0,
				sumY = 0,
				sumXX = 0,
				sumYY = 0,
				sumXY = 0;
			for (let j = 0; j < winLen; j++) {
				const idx = b * numFrames + (winStart + j);
				xEnv[j] = xBands[idx];
				yEnv[j] = yBands[idx];
				sumX += xEnv[j];
				sumY += yEnv[j];
				sumXX += xEnv[j] * xEnv[j];
				sumYY += yEnv[j] * yEnv[j];
				sumXY += xEnv[j] * yEnv[j];
			}

			// Коэффициент Пирсона
			const num = sumXY - (sumX * sumY) / winLen;
			const den = Math.sqrt(
				(sumXX - (sumX * sumX) / winLen) * (sumYY - (sumY * sumY) / winLen),
			);
			const r = den > 1e-8 ? num / den : 0;
			correlations.push(r);
		}
	}

	// 4. УСРЕДНЕНИЕ И КЛИППИНГ
	const avgCorr = correlations.reduce((a, b) => a + b, 0) / correlations.length;
	const stoiScore = Math.max(0, Math.min(1, avgCorr));

	debugLog("STOI", "Complete", {
		score: stoiScore,
		correlationsCount: correlations.length,
	});
	return stoiScore;
}

/**
 * Подготовка сигнала: приведение к моно, ресемплинг до 10 кГц, нормализация энергии
 */
function prepareSignal(
	signal: Float32Array,
	inFs: number,
	outFs: number,
): Float32Array {
	let sig = signal;

	// Ресемплинг (простой линейный интерполятор, достаточный для STOI)
	if (inFs !== outFs) {
		const ratio = inFs / outFs;
		const outLen = Math.floor(sig.length / ratio);
		const resampled = new Float32Array(outLen);
		for (let i = 0; i < outLen; i++) {
			const srcIdx = i * ratio;
			const idx = Math.floor(srcIdx);
			const frac = srcIdx - idx;
			const next = Math.min(idx + 1, sig.length - 1);
			resampled[i] = sig[idx] * (1 - frac) + sig[next] * frac;
		}
		sig = resampled;
	}

	// Выравнивание длины (обрезка до кратного HOP_LEN + FRAME_LEN)
	const validLen = sig.length - (sig.length % 128);
	if (validLen < 256) return new Float32Array(0);
	sig = sig.subarray(0, validLen);

	// Нормализация энергии к единичной дисперсии
	let mean = 0;
	for (let i = 0; i < sig.length; i++) mean += sig[i];
	mean /= sig.length;

	let varSum = 0;
	for (let i = 0; i < sig.length; i++) {
		const d = sig[i] - mean;
		varSum += d * d;
	}
	const std = Math.sqrt(varSum / sig.length);
	if (std > 1e-10) {
		for (let i = 0; i < sig.length; i++) sig[i] = (sig[i] - mean) / std;
	}

	return sig;
}

/**
 * Предвычисление маппинга FFT-бинов в 1/3-октавные полосы
 */
function computeBandMapping(
	fftSize: number,
	fs: number,
	edges: number[],
): [number, number][] {
	const mapping: [number, number][] = [];
	const binWidth = fs / fftSize;

	for (let b = 0; b < edges.length - 1; b++) {
		const startBin = Math.max(1, Math.ceil(edges[b] / binWidth));
		const endBin = Math.min(
			fftSize / 2 - 1,
			Math.floor(edges[b + 1] / binWidth),
		);
		mapping.push([startBin, endBin]);
	}
	return mapping;
}

// [ANCHOR/> PESQ

/**
 * Улучшенная аппроксимация перцептивного качества
 * На основе спектрального расстояния + временной корреляции + весовая функция частот
 */
export function calculatePESQApprox(
	reference: Float32Array[],
	degraded: Float32Array[],
	fs: number = 16000,
): number {
	const FRAME_MS = 32; // мс
	const HOP_MS = 16;
	const frameSize = Math.round((fs * FRAME_MS) / 1000);
	const hopSize = Math.round((fs * HOP_MS) / 1000);

	// Веса для частотных полос (упрощённая модель важности для речи)
	// Больше вес на 300-3400 Гц (телефонная полоса)
	const freqWeights = new Float32Array(frameSize / 2);
	for (let k = 0; k < freqWeights.length; k++) {
		const freq = (k * fs) / frameSize;
		if (freq < 300 || freq > 3400) {
			freqWeights[k] = 0.3; // Низкая важность
		} else if (freq < 1000) {
			freqWeights[k] = 1.0; // Высокая важность
		} else {
			freqWeights[k] = 0.7; // Средняя важность
		}
	}

	let totalDisturbance = 0;
	let frameCount = 0;

	for (let ch = 0; ch < Math.min(reference.length, degraded.length); ch++) {
		const ref = reference[ch];
		const deg = degraded[ch];
		const len = Math.min(ref.length, deg.length);

		for (let start = 0; start + frameSize <= len; start += hopSize) {
			// Извлечение фреймов с окном Ханна
			const refFrame = new Float32Array(frameSize);
			const degFrame = new Float32Array(frameSize);
			for (let i = 0; i < frameSize; i++) {
				const window =
					0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
				refFrame[i] = ref[start + i] * window;
				degFrame[i] = deg[start + i] * window;
			}

			// БПФ
			const refSpec = fft(refFrame);
			const degSpec = fft(degFrame);

			// Логарифмическое спектральное расстояние с весами
			let frameDist = 0;
			let weightSum = 0;
			for (let k = 0; k < frameSize / 2; k++) {
				const magRef =
					Math.sqrt(refSpec[k].re ** 2 + refSpec[k].im ** 2) + 1e-10;
				const magDeg =
					Math.sqrt(degSpec[k].re ** 2 + degSpec[k].im ** 2) + 1e-10;
				const logDiff = Math.abs(Math.log10(magRef) - Math.log10(magDeg));
				frameDist += logDiff * freqWeights[k];
				weightSum += freqWeights[k];
			}
			frameDist /= weightSum + 1e-10;

			// Штраф за временную десинхронизацию (упрощённо)
			// Можно расширить через cross-correlation
			const temporalCorr = computeTemporalCorrelation(refFrame, degFrame);
			const syncPenalty = Math.max(0, 1 - temporalCorr) * 0.5;

			totalDisturbance += frameDist + syncPenalty;
			frameCount++;
		}
	}

	if (frameCount === 0) return -0.5;

	const avgDisturbance = totalDisturbance / frameCount;

	// Эмпирическая маппинг-функция (калибрована на небольшом наборе данных)
	// MOS ≈ 4.5 - k * disturbance, где k ≈ 0.8–1.2
	const mos = 4.5 - 0.95 * avgDisturbance;

	return Math.max(-0.5, Math.min(4.5, mos));
}

/**
 * Вычисляет нормированную кросс-корреляцию двух фреймов
 */
function computeTemporalCorrelation(a: Float32Array, b: Float32Array): number {
	let meanA = 0,
		meanB = 0;
	for (let i = 0; i < a.length; i++) {
		meanA += a[i];
		meanB += b[i];
	}
	meanA /= a.length;
	meanB /= b.length;

	let num = 0,
		denA = 0,
		denB = 0;
	for (let i = 0; i < a.length; i++) {
		const da = a[i] - meanA;
		const db = b[i] - meanB;
		num += da * db;
		denA += da * da;
		denB += db * db;
	}
	const den = Math.sqrt(denA * denB);
	return den > 1e-10 ? num / den : 0;
}

// [!SECTION/>

// [SECTION/> ВИДЕО МЕТРИКИ

export function calculateVideoMetrics(
	original: Uint8ClampedArray,
	noisy: Uint8ClampedArray,
	denoised: Uint8ClampedArray,
	width: number,
	height: number,
): {
	before: VideoMetrics;
	after: VideoMetrics;
	improvement: Record<string, number>;
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
	processed: Uint8ClampedArray,
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
	windowSize: number = 11,
): number {
	if (DEBUG)
		console.log(`[SSIM] Start: ${width}×${height}, window=${windowSize}`);

	const channels = 4;
	const C1 = (0.01 * 255) ** 2;
	const C2 = (0.03 * 255) ** 2;

	let ssimSum = 0;
	let count = 0;

	const actualWindowSize = Math.min(windowSize, Math.min(width, height) - 2);
	if (actualWindowSize < 3) {
		return calculateSimpleSimilarity(original, processed, width, height);
	}
	const halfWin = Math.floor(actualWindowSize / 2);

	for (let y = halfWin; y < height - halfWin; y++) {
		for (let x = halfWin; x < width - halfWin; x++) {
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
	height: number,
): number {
	let match = 0;
	for (let i = 0; i < orig.length; i += 4) {
		const yOrig = 0.299 * orig[i] + 0.587 * orig[i + 1] + 0.114 * orig[i + 2];
		const yProc = 0.299 * proc[i] + 0.587 * proc[i + 1] + 0.114 * proc[i + 2];
		if (Math.abs(yOrig - yProc) < 10) match++;
	}
	return match / (width * height);
}

// [ANCHOR/> MSSSIM
export function calculateMSSSIM(
	original: Uint8ClampedArray,
	processed: Uint8ClampedArray,
	width: number,
	height: number,
	numScales: number = 5,
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

export function complexMagnitude(c: Complex): number {
	return Math.hypot(c.re + c.im);
}
