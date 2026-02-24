import { cloneFloat32Array } from "../audio-processing";
import { gaussianNoise } from "./gaussian-noise";

export async function colorNoise(
	signal: Float32Array[],
	noiseVariance: number,
	blurStrength: number
): Promise<Float32Array[]>;

export async function colorNoise(
	signal: ImageData,
	noiseVariance: number,
	blurStrength: number
): Promise<Uint8ClampedArray>;

export async function colorNoise(
	signal: Float32Array[] | ImageData,
	noiseVariance: number,
	blurStrength: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return await audioColorNoise(signal, noiseVariance);
	else if (signal instanceof ImageData)
		return await imageColorNoise(
			signal,
			0,
			noiseVariance,
			blurStrength,
			2 * Math.ceil(2 * blurStrength) + 1
		);

	return signal;
}

async function audioColorNoise(
	data: Float32Array[],
	sigma: number
): Promise<Float32Array[]> {
	let newData = data.map((ch) => cloneFloat32Array(ch));

	newData = await gaussianNoise(newData, sigma);

	// при f_c = 0.2 после билинейного преобразования
	// -3 дБ на частоте 0.2 + гладкий спад
	const b = [0.0675, 0.1349, 0.0675];
	const a = [1.0, -1.143, 0.4128];

	newData = newData.map((ch) => butterworthFilter(ch, b, a));

	return newData;
}

async function imageColorNoise(
	imageData: ImageData,
	mu: number,
	sigma: number,
	sigmaBlur: number,
	kernelSize: number
): Promise<Uint8ClampedArray> {
	const newData = new Uint8ClampedArray(imageData.data);

	newData.set(await gaussianNoise(newData, sigma));
	newData.set(
		gaussianBlur(
			newData,
			createKernel(kernelSize, sigmaBlur),
			imageData.height,
			imageData.width
		)
	);

	return newData;
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

function gaussianBlur(
	data: Uint8ClampedArray,
	kernel: number[],
	imageHeight: number,
	imageWidth: number
): Uint8ClampedArray {
	const newData = new Uint8ClampedArray(data.length);
	const radius = Math.floor(Math.sqrt(kernel.length) / 2);

	for (let y = 0; y < imageHeight; y++) {
		for (let x = 0; x < imageWidth; x++) {
			const i = (y * imageWidth + x) * 4;

			// канал rgb
			for (let c = 0; c < 3; c++) {
				let sum = 0;
				let kernelIndex = 0;

				for (let ky = -radius; ky <= radius; ky++)
					for (let kx = -radius; kx <= radius; kx++) {
						let nx = x + kx;
						let ny = y + ky;

						nx = Math.max(0, Math.min(nx, imageWidth - 1));
						ny = Math.max(0, Math.min(ny, imageHeight - 1));

						const neighborImndex = (ny * imageWidth + nx) * 4 + c;
						sum += data[neighborImndex] * kernel[kernelIndex];

						kernelIndex++;
					}
				newData[i + c] = Math.max(0, Math.min(255, sum));
			}

			// значение прозрачности (альфа-канал)
			newData[i + 3] = data[i + 3];
		}
	}

	return newData;
}

function createKernel(size: number, sigma: number): number[] {
	if (size % 2 === 0) ++size;

	const radius = Math.floor(size / 2);
	const kernel = [];

	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			const x = i - radius;
			const y = j - radius;

			const gaussian = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
			kernel.push(gaussian);
		}
	}

	const sum = kernel.reduce((s, x) => s + x, 0);
	return kernel.map((x) => x / sum);
}
