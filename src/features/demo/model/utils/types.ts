export const FILE_FORMATS: Record<string, string[]> = {
	image: ["png"],
	audio: ["wav"],
} as const;

export type FileType = keyof typeof FILE_FORMATS;

export const STRING_FORMATS = Object.entries(FILE_FORMATS)
	.reduce((acc, [type, format]) => {
		acc += format.map((fmt) => `${type}/${fmt},`);
		return acc;
	}, "")
	.slice(0, -1);

export const NOISE_TYPES = {
	gaussian: "Гауссов",
	color: "Цветной",
	impulse: "Импульсный",
} as const;

export type NoiseType = keyof typeof NOISE_TYPES;

export const DENOISE_TYPES = {
	bayessian: "Фильтра Байеса",
	wiener: "Фильтр Винера",
	hmm: "Скрытые марковские модели",
} as const;

export type DenoiseType = keyof typeof DENOISE_TYPES;

export type AudiobufferData = {
	data: Float32Array[];
	sampleRate: number;
};

export const METRICS_TYPES: Record<string, Record<string, string>> = {
	audio: {
		snr: "дБ",
		stoi: "%",
		pesq: "",
	},
	image: {
		ssim: "%",
		psnr: "дБ",
	},
};
