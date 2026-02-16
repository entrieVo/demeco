import {
	imageDataToUrl,
	fileToImageData,
	imageDataToBlob,
} from "./image-processing";
import { normalDistribution } from "./probability_distribution";
import { NOISE_TYPES } from "@/features/constants";

// [SECTION/> Гауссов шум

export async function applyGaussianImageNoise(
	file: File,
	sigma: number
): Promise<Blob> {
	const imageData = await fileToImageData(file);

	const newData = new Uint8ClampedArray(imageData.data);
	newData.set(gaussianNoise(newData, 0, sigma));

	return await imageDataToBlob(imageData, newData);
}

function gaussianNoise(
	data: Uint8ClampedArray,
	mu: number,
	sigma: number
): Uint8ClampedArray {
	const newData = new Uint8ClampedArray(data);

	for (let i = 0; i < newData.length; i += 4) {
		newData[i] = newData[i] + normalDistribution(mu, sigma);
		newData[i + 1] = newData[i + 1] + normalDistribution(mu, sigma);
		newData[i + 2] = newData[i + 2] + normalDistribution(mu, sigma);
	}

	return newData;
}

// [!SECTION/> !Гауссов шум

// [SECTION/> Цветной шум

export async function applyColorImageNoise(
	file: File,
	sigma: number,
	sigmaBlur: number
): Promise<Blob> {
	const imageData = await fileToImageData(file);

	const newData = new Uint8ClampedArray(imageData.data);
	newData.set(
		colorNoise(imageData, 0, sigma, sigmaBlur, 2 * Math.ceil(2 * sigmaBlur) + 1)
	);

	return await imageDataToBlob(imageData, newData);
}

function colorNoise(
	imageData: ImageData,
	mu: number,
	sigma: number,
	sigmaBlur: number,
	kernelSize: number
): Uint8ClampedArray {
	const newData = new Uint8ClampedArray(imageData.data);

	newData.set(gaussianNoise(newData, mu, sigma));
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

// [!SECTION/> !Цветной шум

// [SECTION/> Импульсный шум

export async function applySaltPepperImageNoise(
	file: File,
	p: number
): Promise<Blob> {
	const imageData = await fileToImageData(file);

	const newData = new Uint8ClampedArray(imageData.data);
	newData.set(saltPepperNoise(newData, p));

	return await imageDataToBlob(imageData, newData);
}

function saltPepperNoise(
	data: Uint8ClampedArray,
	p: number
): Uint8ClampedArray {
	const newData = new Uint8ClampedArray(data.length);

	for (let i = 0; i < newData.length; i += 4) {
		const random = Math.random();

		if (random < p / 2) {
			newData[i] = 0;
			newData[i + 1] = 0;
			newData[i + 2] = 0;
		} else if (random > 1 - p / 2) {
			newData[i] = 255;
			newData[i + 1] = 255;
			newData[i + 2] = 255;
		} else {
			newData[i] = data[i];
			newData[i + 1] = data[i + 1];
			newData[i + 2] = data[i + 2];
		}
		newData[i + 3] = data[i + 3];
	}

	return newData;
}

// [!SECTION/> !Импульсный шум
