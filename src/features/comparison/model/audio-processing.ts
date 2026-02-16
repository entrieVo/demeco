export async function audioBufferFromFile(file: File): Promise<AudioBuffer> {
	const arrayBuffer = await file.arrayBuffer();

	const audioContext = new window.AudioContext();
	return await audioContext.decodeAudioData(arrayBuffer);
}

export async function cloneChannels(
	audioBuffer: AudioBuffer
): Promise<Float32Array[]> {
	const channels: Float32Array[] = [];
	for (let i = 0; i < (await audioBuffer).numberOfChannels; i++) {
		const ch = (await audioBuffer).getChannelData(i);
		channels.push(new Float32Array(ch));
	}

	return channels;
}

export function cloneFloat32Array(arr: Float32Array): Float32Array {
	const copy = new Float32Array(arr.length);
	copy.set(arr);
	return copy;
}

export function encodeWAV(
	channels: Float32Array[],
	sampleRate: number,
	bitDepth = 16
): Blob {
	const numChannels = channels.length;
	const length = channels[0].length;
	const buffer = new ArrayBuffer(44 + length * numChannels * 2);
	const view = new DataView(buffer);

	// WAV-заголовок (упрощённый, 16-bit PCM)
	const writeString = (offset: number, str: string) =>
		[...str].forEach((char, i) =>
			view.setUint8(offset + i, char.charCodeAt(0))
		);

	writeString(0, "RIFF");
	view.setUint32(4, 36 + length * numChannels * 2, true);
	writeString(8, "WAVE");
	writeString(12, "fmt ");
	view.setUint32(16, 16, true); // размер подчанка fmt
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * numChannels * 2, true);
	view.setUint16(32, numChannels * 2, true);
	view.setUint16(34, 16, true); // бит на выборку
	writeString(36, "data");
	view.setUint32(40, length * numChannels * 2, true);

	// Данные
	let offset = 44;
	for (let i = 0; i < length; i++) {
		for (let ch = 0; ch < numChannels; ch++) {
			const val = Math.max(-1, Math.min(1, channels[ch][i]));
			const intVal = val < 0 ? val * 32768 : val * 32767;
			view.setInt16(offset, intVal, true);
			offset += 2;
		}
	}

	return new Blob([view], { type: "audio/wav" });
}
