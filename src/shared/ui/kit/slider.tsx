import React, { useState } from "react";
import { Title } from "./title";

interface SliderProps {
	min?: number;
	max?: number;
	step?: number;
	value?: number;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	children?: React.ReactNode;
	className?: string;
}

export function Slider({
	min = 0,
	max = 10,
	step = 1,
	value,
	onChange,
	children,
	className,
}: SliderProps) {
	const [sliderValue, setSliderValue] = useState<number>(value || min);

	const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSliderValue(+e.target.value);
		if (onChange) onChange(e);
	};

	return (
		<div className={className}>
			{children}
			<div className={`flex gap-3`}>
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					onChange={handleSlider}
					value={sliderValue}
				/>
				<div>{sliderValue}</div>
			</div>
		</div>
	);
}

interface SliderTitleProps {
	children: string;
	className?: string;
}

export function SliderTitle({ children, className }: SliderTitleProps) {
	return (
		<div className={className}>
			<Title variant="sm">{children}</Title>
		</div>
	);
}
