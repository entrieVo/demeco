export const VERSION = 0.1;
export const AUTHOR = "Василец Анастасия Вячеславовна";

export const FILE_TYPES = {
	IMAGE: { FORMAT: "image/png", LABEL: "изображения (png)" },
	AUDIO: { FORMAT: "audio/wav", LABEL: "аудио (wav)" },
	VIDEO: { FORMAT: "", LABEL: "видео" },
} as const;

export type FileType = (typeof FILE_TYPES)[keyof typeof FILE_TYPES];

export const NOISE_TYPES = {
	GAUSSIAN: "Гауссов",
	COLOR: "Цветной",
	IMPULSE: "Импульсный",
} as const;

export type NoiseType = (typeof NOISE_TYPES)[keyof typeof NOISE_TYPES];
