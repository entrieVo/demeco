import { useEffect, useState } from "react";
import { cloneChannels, fileToAudioBuffer } from "../utils/audio-processing";
import { whichFormat } from "../utils/formats";
import { fileToImageData } from "../utils/image-processing";
import {
	AudiobufferData,
	FileType,
	NoiseType,
	DENOISE_TYPES,
	DenoiseType,
} from "../utils/types";
import { addNoise, calculateMetrics, denoiseSignal } from "./signal-processing";
import { Metrics } from "../utils/metrics";

interface DemoData {
	info: Record<string, string>;
	type: FileType | null;
	original: AudiobufferData | ImageData | null;
	noised: AudiobufferData | ImageData | null;
	denoised: Record<DenoiseType, AudiobufferData | ImageData> | null;
	metrics: Record<DenoiseType, Metrics> | null;
	onNoise: () => AudiobufferData | ImageData | null;
	onDenoise: (newNoised: AudiobufferData | ImageData) => void;
}

export function useDemoData(
	file: File | null,
	noise: NoiseType,
	strength: number,
	blur: number,
): DemoData {
	const [info, setInfo] = useState<Record<string, string>>({});
	const [original, setRef] = useState<AudiobufferData | ImageData | null>(null);
	const [type, setType] = useState<FileType | null>(null);
	const [noised, setNoised] = useState<AudiobufferData | ImageData | null>(
		null,
	);
	const [denoised, setDenoised] = useState<Record<
		DenoiseType,
		AudiobufferData | ImageData
	> | null>(null);
	const [metrics, setMetrics] = useState<Record<DenoiseType, Metrics> | null>(
		null,
	);

	useEffect(() => {
		if (!file) return;

		const updateData = async () => {
			const {
				info: newInfo,
				type: newType,
				audiobuffer,
				imageData,
			} = await getData(file);

			setInfo(newInfo);
			setType(newType ? newType : null);
			setRef(audiobuffer || imageData || null);

			setNoised(null);
			setDenoised(null);
			setMetrics(null);
		};
		updateData();
	}, [file]);

	const onNoise = (): AudiobufferData | ImageData | null => {
		if (!original) return null;

		const newNoised = addNoise(original, noise, strength, blur);
		setNoised(newNoised);
		return newNoised;
	};

	const onDenoise = (newNoised: AudiobufferData | ImageData) => {
		if (!original || !newNoised) return;

		const newDenoised = {} as Record<DenoiseType, AudiobufferData | ImageData>;
		const newMetrics = {} as Record<DenoiseType, Metrics>;

		Object.keys(DENOISE_TYPES).forEach((denoise) => {
			const denoisedSignal = denoiseSignal(
				newNoised,
				denoise as DenoiseType,
				strength,
			);
			newDenoised[denoise as DenoiseType] = denoisedSignal;
			newMetrics[denoise as DenoiseType] = calculateMetrics(
				original.data,
				newNoised.data,
				denoisedSignal.data,
				(original as ImageData).width,
				(original as ImageData).height,
			);
		});

		setDenoised(newDenoised);
		setMetrics(newMetrics);
	};

	return {
		info,
		type,
		original,
		noised,
		denoised,
		metrics,
		onNoise,
		onDenoise,
	};
}

interface FileData {
	info: Record<string, string>;
	type?: FileType;
	audiobuffer?: AudiobufferData;
	imageData?: ImageData;
}

async function getData(file: File): Promise<FileData> {
	const type = whichFormat(file.type);
	const baseInfo: Record<string, string> = {
		Имя: file.name.slice(0, file.name.lastIndexOf(".")),
		Формат: type === "audio" ? "аудиосигнал" : "видеосигнал",
	};
	let audiobuffer: AudioBuffer;
	let imageData: ImageData;

	if (type === "audio") {
		audiobuffer = await fileToAudioBuffer(file);
		const data = await cloneChannels(audiobuffer);
		return {
			info: {
				...baseInfo,
				Продолжительность: Math.trunc(audiobuffer.duration * 10) / 10 + " с",
				"Частота дискретизации": audiobuffer.sampleRate + " Гц",
			},
			type,
			audiobuffer: { data, sampleRate: audiobuffer.sampleRate },
		};
	} else if (type === "image") {
		imageData = await fileToImageData(file);
		const { width, height } = imageData;

		return {
			info: {
				...baseInfo,
				Разрешение: `${width}x${height}`,
			},
			type,
			imageData: imageData,
		};
	}

	return { info: baseInfo };
}
