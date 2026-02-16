import {
	audioBufferFromFile,
	cloneChannels,
	cloneFloat32Array,
	encodeWAV,
} from "./audio-processing";
import { normalDistribution } from "./probability_distribution";

// [SECTION/> Гауссов шум

export async function applyGaussianAudioNoise(
	file: File,
	sigma: number
): Promise<Blob> {
	const audioBuffer = await audioBufferFromFile(file);
	const newAudioBuffer = gaussianAudioNoise(
		await cloneChannels(audioBuffer),
		sigma
	);

	return encodeWAV(newAudioBuffer, audioBuffer.sampleRate);
}

function gaussianAudioNoise(
	audioBuffer: Float32Array[],
	sigma: number
): Float32Array[] {
	let newAudioBuffer = audioBuffer.map((ch) => cloneFloat32Array(ch));

	newAudioBuffer = newAudioBuffer.map((channel) =>
		channel.map((ch) =>
			Math.max(-1, Math.min(1, ch + normalDistribution(0, sigma)))
		)
	);

	return newAudioBuffer;
}

// [!SECTION/> !Гауссов шум

// [SECTION/> Цветной шум

export async function applyColoredAudioNoise(
	file: File,
	sigma: number
): Promise<Blob> {
	const audioBuffer = await audioBufferFromFile(file);

	const newAudioBuffer = await coloredAudioNoise(
		await cloneChannels(audioBuffer),
		sigma
	);

	return encodeWAV(newAudioBuffer, audioBuffer.sampleRate);
}

function coloredAudioNoise(
	audioBuffer: Float32Array[],
	sigma: number
): Float32Array[] {
	let newAudioBuffer = audioBuffer.map((ch) => cloneFloat32Array(ch));

	newAudioBuffer = gaussianAudioNoise(newAudioBuffer, sigma);

	// при f_c = 0.2 после билинейного преобразования
	// -3 дБ на частоте 0.2 + гладкий спад
	const b = [0.0675, 0.1349, 0.0675];
	const a = [1.0, -1.143, 0.4128];

	newAudioBuffer = newAudioBuffer.map((ch) => butterworthFilter(ch, b, a));

	return newAudioBuffer;
}

function butterworthFilter(
	signal: Float32Array,
	b: number[],
	a: number[]
): Float32Array {
	const n = signal.length;
	const y = new Float32Array(n);

	// Начальные условия: y[-1] = y[-2] = 0
	let y1 = 0,
		y2 = 0; // y[n-1], y[n-2]
	let x1 = 0,
		x2 = 0; // x[n-1], x[n-2]

	for (let i = 0; i < n; i++) {
		const x0 = signal[i];

		// y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
		const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;

		x2 = x1;
		x1 = x0;
		y2 = y1;
		y1 = y0;

		y[i] = Math.max(-1, Math.min(y0, 1));
	}

	return y;
}

// [!SECTION/> !Цветной шум

// [SECTION/> Импульсный шум

export async function applyImpulseAudioNoise(
	file: File,
	p: number
): Promise<Blob> {
	const audioBuffer = await audioBufferFromFile(file);

	const newAudioBuffer = await impulseAudioNoise(
		await cloneChannels(audioBuffer),
		p,
		1
	);

	return encodeWAV(newAudioBuffer, audioBuffer.sampleRate);
}

function impulseAudioNoise(
	audioBuffer: Float32Array[],
	p: number,
	amplitude: number
): Float32Array[] {
	let newAudioBuffer = audioBuffer.map((ch) => cloneFloat32Array(ch));

	newAudioBuffer = newAudioBuffer.map((signal) =>
		signal.map((channel) => {
			if (Math.random() < p) return Math.random() < 0.5 ? -1 : 1 * amplitude;
			else return channel;
		})
	);

	return newAudioBuffer;
}

// [!SECTION/> !Импульсный шум
