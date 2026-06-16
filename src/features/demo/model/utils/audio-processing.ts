import { useMemo } from "react";

export async function fileToAudioBuffer(file: File): Promise<AudioBuffer> {
	const arrayBuffer = await file.arrayBuffer();

	const audioContext = new window.AudioContext();
	return await audioContext.decodeAudioData(arrayBuffer);
}

export async function cloneChannels(
	audioBuffer: AudioBuffer,
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

export function channelsToBlob(
	channels: Float32Array[] | null,
	sampleRate: number,
): Blob {
	if (!channels) return new Blob();

	const numChannels = channels.length;
	const length = channels[0].length;
	const buffer = new ArrayBuffer(44 + length * numChannels * 2);
	const view = new DataView(buffer);

	const writeString = (offset: number, str: string) =>
		[...str].forEach((char, i) =>
			view.setUint8(offset + i, char.charCodeAt(0)),
		);

	writeString(0, "RIFF");
	view.setUint32(4, 36 + length * numChannels * 2, true);
	writeString(8, "WAVE");
	writeString(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * numChannels * 2, true);
	view.setUint16(32, numChannels * 2, true);
	view.setUint16(34, 16, true);
	writeString(36, "data");
	view.setUint32(40, length * numChannels * 2, true);

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

export function useStereoToMono(data: Float32Array[]): Float32Array {
	return useMemo(() => {
		if (data.length === 0) return new Float32Array(0);
		if (data.length === 1) return data[0];

		const length = Math.min(...data.map((ch) => ch.length));
		const mono = new Float32Array(length);

		for (let i = 0; i < length; i++) {
			let sum = 0;
			for (let ch = 0; ch < data.length; ch++) {
				sum += data[ch][i];
			}
			mono[i] = sum / data.length;
		}

		return mono;
	}, [data]);
}

export function getDurationMs(
	monoSignal: Float32Array,
	sampleRate: number,
): number {
	return (monoSignal.length / sampleRate) * 1000;
}
