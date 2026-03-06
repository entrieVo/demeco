import { cloneFloat32Array } from "../audio-processing";
import { fft, Complex, ifft } from "../fft";
import { binProps, createSpectrum, hannWindow } from "../stft";

export async function wienerDenoise(
	signal: Float32Array[],
	noiseVariance: number
): Promise<Float32Array[]>;

export async function wienerDenoise(
	signal: Uint8ClampedArray,
	noiseVariance: number,
	width?: number,
	height?: number
): Promise<Uint8ClampedArray>;

export async function wienerDenoise(
	signal: Float32Array[] | Uint8ClampedArray,
	noiseVariance: number,
	width?: number,
	height?: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioWienerFilter(signal, noiseVariance);
	else if (signal instanceof Uint8ClampedArray && width && height)
		return imageWienerFilter(signal, noiseVariance, width, height);

	return signal;
}

function audioWienerFilter(
	signal: Float32Array[],
	noiseVariance: number
): Float32Array[] {
	return stft(signal, noiseVariance);
}

function wienerFilter(
	amplitude: Float32Array,
	noiseVariance: number,
	minGain: number = 0.02
): Float32Array {
	const N = amplitude.length;
	const filtered = new Float32Array(N);

	for (let k = 0; k < N; k++) {
		const signalPower = amplitude[k] ** 2;
		const wienerGain = signalPower / (signalPower + noiseVariance);
		const clampedGain = Math.max(minGain, Math.min(1, wienerGain));

		filtered[k] = clampedGain * amplitude[k];
	}

	for (let k = 1; k < N / 2; k++) {
		filtered[N - k] = filtered[k];
	}

	return filtered;
}

function stft(signal: Float32Array[], noiseVariance: number): Float32Array[] {
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

			const filteredAmplitude = wienerFilter(amplitude, noiseVariance);

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

function imageWienerFilter(
	signal: Uint8ClampedArray,
	noiseVariance: number,
	width: number,
	height: number
): Uint8ClampedArray {
	const windowRadius = 2;
	const filteredSignal = new Uint8ClampedArray(signal.length);

	for (let channelOffset = 0; channelOffset < 3; channelOffset++) {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const { mean, variance } = calculateLocalStats(
					signal,
					x,
					y,
					width,
					height,
					windowRadius,
					channelOffset
				);

				const pixelIndex = y * width + x;
				const arrayIndex = pixelIndex * 4 + channelOffset;
				const currentValue = signal[arrayIndex];

				const filteredValue = applyWienerToPixel(
					currentValue,
					mean,
					variance,
					noiseVariance
				);

				filteredSignal[arrayIndex] = filteredValue;
			}
		}
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const pixelIndex = y * width + x;
			const srcAlphaIndex = pixelIndex * 4 + 3;
			const dstAlphaIndex = pixelIndex * 4 + 3;
			filteredSignal[dstAlphaIndex] = signal[srcAlphaIndex];
		}
	}

	return filteredSignal;
}

function applyWienerToPixel(
	currentValue: number,
	localMean: number,
	localVariance: number,
	noiseVariance: number,
	minGain: number = 0.05
): number {
	const signalVariance = Math.max(0, localVariance - noiseVariance);
	const wienerGain = signalVariance / (signalVariance + noiseVariance);
	const clampedGain = Math.max(minGain, Math.min(1, wienerGain));

	return localMean + clampedGain * (currentValue - localMean);
}

function getChannelSafe(
	img: Uint8ClampedArray,
	x: number,
	y: number,
	width: number,
	height: number,
	channelOffset: number
): number {
	x = Math.max(
		0,
		Math.min(width - 1, x < 0 ? -x : x >= width ? 2 * width - x - 2 : x)
	);
	y = Math.max(
		0,
		Math.min(height - 1, y < 0 ? -y : y >= height ? 2 * height - y - 2 : y)
	);

	const pixelIndex = y * width + x;
	const arrayIndex = pixelIndex * 4 + channelOffset;
	return img[arrayIndex];
}

function calculateLocalStats(
	img: Uint8ClampedArray,
	centerX: number,
	centerY: number,
	width: number,
	height: number,
	radius: number,
	channelOffset: number
): { mean: number; variance: number } {
	let sum = 0;
	let sumSq = 0;
	let count = 0;

	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			const x = centerX + dx;
			const y = centerY + dy;

			const pixelValue = getChannelSafe(
				img,
				x,
				y,
				width,
				height,
				channelOffset
			);
			sum += pixelValue;
			sumSq += pixelValue;
			count++;
		}
	}

	const mean = sum / count;
	const variance = sumSq / count - mean * mean;

	return { mean, variance };
}
