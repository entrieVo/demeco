export const VERSION = 0.1;
export const AUTHOR = "Василец Анастасия Вячеславовна";

export const FILE_TYPES = {
	IMAGE: { FORMAT: "image/png", LABEL: "изображения" },
	AUDIO: { FORMAT: "audio/wav", LABEL: "аудио" },
	VIDEO: { FORMAT: "", LABEL: "видео" },
} as const;

export const NOISE_TYPES = {
	GAUSSIAN: "Гауссов",
	COLORED: "Цветной",
	IMPULSE: "Импульсный",
} as const;

export type NoiseType = (typeof NOISE_TYPES)[keyof typeof NOISE_TYPES];
