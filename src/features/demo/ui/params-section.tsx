import { Title } from "@/shared/ui/kit/title";
import { NOISE_TYPES, NoiseType } from "../model/utils/types";
import { Slider, SliderTitle } from "@/shared/ui/kit/slider";
import { createDemoHandlers } from "../model/processing/create-demo-handlers";
import { RadioGroup, RadioGroupTitle } from "@/shared/ui/kit/radio-group";

interface ParamsSectionProps {
	title?: string;
	noise: NoiseType;
	strength: number;
	blur: number;
	noiseControl: {
		strength: Record<string, number>;
		blur: Record<string, number>;
	};
	setNoise: (value: NoiseType) => void;
	setStrength: (value: number) => void;
	setBlur: (value: number) => void;
	className?: string;
}

export function ParamsSection({
	title,
	noise,
	strength,
	blur,
	noiseControl,
	setNoise,
	setStrength,
	setBlur,
	className,
}: ParamsSectionProps) {
	const { handleNoiseRadio, handleStrengthSlider, handleBlurSlider } =
		createDemoHandlers(setNoise, setStrength, setBlur);

	return (
		<div className={className}>
			{title && <Title>{title}</Title>}
			<div className={`flex gap-y-3 gap-x-10 flex-wrap`}>
				<RadioGroup
					options={NOISE_TYPES}
					value={noise}
					onChange={handleNoiseRadio}>
					<RadioGroupTitle>Тип шума</RadioGroupTitle>
				</RadioGroup>

				<div className={`flex flex-col justify-between`}>
					<Slider
						onChange={handleStrengthSlider}
						{...noiseControl.strength}
						value={strength}>
						<SliderTitle>Сила шума</SliderTitle>
					</Slider>
					{noise === "color" && (
						<Slider
							onChange={handleBlurSlider}
							{...noiseControl.blur}
							value={blur}>
							<SliderTitle>Сила размытия</SliderTitle>
						</Slider>
					)}
				</div>
			</div>
		</div>
	);
}
