import { NOISE_TYPES, NoiseType } from "@/features/constants";
import { Button } from "@/shared/ui/kit/button";
import { Card } from "@/shared/ui/kit/card";
import { Select, SelectContent, SelectItem } from "@/shared/ui/kit/select";
import { Slider } from "@/shared/ui/kit/slider";
import { Separator } from "@/shared/ui/kit/separator";
import { ArrowDownRightIcon, Cat } from "lucide-react";
import { cn } from "@/shared/lib/css";

interface ComparisonParamsProps {
	noiseParams: { sigma: number; sigmaBlur: number };
	onSigmaChange: (value: number[]) => void;
	onSigmaBlurChange: (value: number[]) => void;
	selectedNoise: NoiseType;
	onNoiseSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	onNoiseApply: () => void;
	className?: string;
}

export function ComparisonParams({
	noiseParams,
	onSigmaChange,
	onSigmaBlurChange,
	selectedNoise,
	onNoiseSelect,
	onNoiseApply,
	className,
}: ComparisonParamsProps) {
	const cardStyles =
		"p-0 py-5 gap-5 bg-accent sm:text-lg md:gap-7 \
		lg:px-10 lg:py-5 lg:bg-primary lg:text-xl lg:grow";

	return (
		<div
			className={cn(
				"flex flex-col gap-(--card-gap) \
		bg-accent rounded-4xl p-5 sm:p-10 lg:p-0 lg:bg-background \
		lg:flex-row lg:flex-wrap",
				className
			)}>
			<>
				<div className="flex gap-2 lg:hidden">
					<div className="bg-background size-8 flex items-center justify-center rounded-full">
						<ArrowDownRightIcon size={"1rem"} color="var(--primary)" />
					</div>
					<div className="bg-background size-8 flex items-center justify-center rounded-full">
						<ArrowDownRightIcon size={"1rem"} color="var(--primary)" />
					</div>
				</div>

				<div
					className="mt-10 bg-primary rounded-full py-1 px-4 self-start
					lg:mt-0 lg:w-full text-center lg:text-2xl lg:bg-accent lg:py-2">
					Параметры шума
				</div>
			</>

			<Card className={cn(cardStyles, "gap-4 md:gap-4")}>
				<h3>Вид шума</h3>
				<Select>
					<SelectContent>
						{Object.entries(NOISE_TYPES).map(([key, label]) => (
							<SelectItem key={key} value={label}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<select onChange={onNoiseSelect} value={selectedNoise}>
					{Object.entries(NOISE_TYPES).map(([key, label]) => (
						<option key={key} value={label}>
							{label}
						</option>
					))}
				</select>
			</Card>

			<Separator className="lg:hidden" />

			<Card className={cardStyles}>
				<div className="flex justify-between">
					<p>Сила шума</p>
					<p className="w-10 ml-5 text-right">{noiseParams.sigma}</p>
				</div>

				<Slider
					id="sigma"
					min={0.1}
					max={1}
					step={0.01}
					defaultValue={[noiseParams.sigma]}
					onValueChange={onSigmaChange}
				/>
			</Card>

			{selectedNoise === NOISE_TYPES.COLORED && (
				<>
					<Separator className="lg:hidden" />

					<Card className={cardStyles}>
						<div className="flex justify-between">
							<p>Сила размытия</p>
							<p className="w-10 ml-5 text-right">{noiseParams.sigmaBlur}</p>
						</div>

						<Slider
							id="sigma"
							min={0.5}
							max={3}
							step={0.5}
							defaultValue={[noiseParams.sigmaBlur]}
							onValueChange={onSigmaBlurChange}
						/>
					</Card>
				</>
			)}

			<Button
				onClick={onNoiseApply}
				variant="secondary"
				size="full"
				className="lg:text-xl lg:bg-accent lg:text-background lg:grow">
				Добавить шум
			</Button>
		</div>
	);
}
