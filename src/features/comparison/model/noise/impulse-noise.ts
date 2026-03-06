import { cloneFloat32Array } from "../audio-processing";

export async function impulseNoise(
	signal: Float32Array[],
	probability: number
): Promise<Float32Array[]>;

export async function impulseNoise(
	signal: Uint8ClampedArray,
	probability: number
): Promise<Uint8ClampedArray>;

export async function impulseNoise(
	signal: Float32Array[] | Uint8ClampedArray,
	probability: number
): Promise<Float32Array[] | Uint8ClampedArray> {
	if (
		Array.isArray(signal) &&
		signal.every((item) => item instanceof Float32Array)
	)
		return audioImpulseNoise(signal, probability, 1);
	else if (signal instanceof Uint8ClampedArray)
		return imageImpulseNoise(signal, probability);

	return signal;
}

function audioImpulseNoise(
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

function imageImpulseNoise(
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
