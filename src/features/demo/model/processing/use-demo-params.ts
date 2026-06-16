import { useState } from "react";
import { NoiseType } from "../utils/types";

interface useDemoParamsReturn {
	noise: string;
	strength: number;
	blur: number;
	setNoise: (newNoise: NoiseType) => void;
	setStrength: (newStrength: number) => void;
	setBlur: (setBlur: number) => void;
	controlParams: {
		noise: { strength: Record<string, number>; blur: Record<string, number> };
	};
}

export function useDemoParams(): useDemoParamsReturn {
	const [noise, setNoise] = useState<NoiseType>("gaussian");
	const [strength, setStrength] = useState<number>(0.2);
	const [blur, setBlur] = useState<number>(1.5);

	const controlParams = {
		noise: {
			strength: {
				min: 0.1,
				max: 1,
				step: 0.01,
			},
			blur: {
				min: 0.5,
				max: 3,
				step: 0.5,
			},
		},
	};

	return {
		noise,
		strength,
		blur,
		setNoise,
		setStrength,
		setBlur,
		controlParams,
	};
}
