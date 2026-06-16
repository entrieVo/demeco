import { bayesianDenoise } from "../denoise/bayesian-denoise";
import { hmmDenoise } from "../denoise/hmm-denoise";
import { wienerDenoise } from "../denoise/wiener-denoise";
import { colorNoise } from "../noise/color-noise";
import { gaussianNoise } from "../noise/gaussian-noise";
import { impulseNoise } from "../noise/impulse-noise";
import { AudiobufferData, DenoiseType, NoiseType } from "../utils/types";
import {
	Metrics,
	calculateAudioMetrics,
	calculateVideoMetrics,
} from "../utils/metrics";

export function addNoise<T extends AudiobufferData | ImageData>(
	signal: T,
	noise: NoiseType,
	strength: number,
	blur: number,
): T {
	let noisedData: Float32Array[] | Uint8ClampedArray = signal.data;

	switch (noise) {
		case "gaussian":
			noisedData = gaussianNoise(signal.data, strength);
			break;
		case "color":
			noisedData = colorNoise(
				signal.data,
				strength,
				blur,
				(signal as ImageData).width,
				(signal as ImageData).height,
			);
			break;
		case "impulse":
			noisedData = impulseNoise(signal.data, strength);
			break;
		default:
			break;
	}

	let noisedSignal: T = signal;
	if ("sampleRate" in signal) {
		const { sampleRate } = signal as AudiobufferData;
		noisedSignal = {
			data: noisedData as Float32Array[],
			sampleRate,
		} as unknown as T;
	} else {
		const { width, height, colorSpace } = signal as ImageData;
		noisedSignal = new ImageData(width, height, { colorSpace }) as unknown as T;
		(noisedSignal.data as ImageDataArray).set(noisedData as Uint8ClampedArray);
	}

	return noisedSignal;
}

export function denoiseSignal<T extends AudiobufferData | ImageData>(
	signal: T,
	denoise: DenoiseType,
	strength: number,
): T {
	const denoiseMethod = {
		bayessian: bayesianDenoise,
		wiener: wienerDenoise,
		hmm: hmmDenoise,
	}[denoise];

	const denoisedData: Float32Array[] | Uint8ClampedArray = denoiseMethod(
		signal.data,
		strength,
		(signal as ImageData).width,
		(signal as ImageData).height,
	);

	let denoisedSignal: T;

	if ("sampleRate" in signal) {
		const { sampleRate } = signal as AudiobufferData;
		denoisedSignal = {
			data: denoisedData as Float32Array[],
			sampleRate,
		} as unknown as T;
	} else if ("width" in signal) {
		const { width, height, colorSpace } = signal as ImageData;
		denoisedSignal = new ImageData(width, height, {
			colorSpace,
		}) as unknown as T;
		(denoisedSignal.data as ImageDataArray).set(
			denoisedData as Uint8ClampedArray,
		);
	} else throw new Error("Неподдерживаемый тип данных.");

	return denoisedSignal;
}

export function calculateMetrics<T extends Uint8ClampedArray | Float32Array[]>(
	original: T,
	noised: T,
	denoised: T,
	width?: number,
	height?: number,
): Metrics {
	let metrics: Metrics;

	if (Array.isArray(original)) {
		metrics = calculateAudioMetrics(
			original as Float32Array[],
			noised as Float32Array[],
			denoised as Float32Array[],
		);
	} else if (width && height) {
		metrics = calculateVideoMetrics(
			original as Uint8ClampedArray,
			noised as Uint8ClampedArray,
			denoised as Uint8ClampedArray,
			width,
			height,
		);
	} else throw new Error("Неподдерживаемый тип данных.");

	return metrics;
}

export async function urlToFile(
	url: string,
	fileName: string,
	mimeType: string,
): Promise<File> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Не удалось загрузить файл: ${response.statusText}`);
	}
	const blob = await response.blob();
	return new File([blob], fileName, { type: mimeType });
}
