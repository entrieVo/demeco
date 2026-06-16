import { NoiseType } from "../utils/types";

interface DemoHandlersReturn {
	handleNoiseRadio: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleStrengthSlider: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleBlurSlider: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function createDemoHandlers(
	setNoise: (noise: NoiseType) => void,
	setStrength: (strength: number) => void,
	setBlur: (strength: number) => void,
): DemoHandlersReturn {
	const handleNoiseRadio = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setNoise(value as NoiseType);
	};
	const handleStrengthSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setStrength(+value);
	};
	const handleBlurSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setBlur(+value);
	};

	return {
		handleNoiseRadio,
		handleStrengthSlider,
		handleBlurSlider,
	};
}
