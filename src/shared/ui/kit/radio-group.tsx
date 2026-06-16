import { twMerge } from "tailwind-merge";
import { Title } from "./title";

interface RadioGroupProps {
	options: Record<string, string>;
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	className?: string;
	children?: React.ReactNode;
}

export function RadioGroup({
	options,
	value: selected,
	onChange,
	children,
	className,
}: RadioGroupProps) {
	return (
		<div className={twMerge(`flex flex-col gap-1`, className)}>
			{children}
			{Object.entries(options).map(([value, label], i) => (
				<label key={i} className={`flex items-center gap-1.5`}>
					<input
						type="radio"
						value={value}
						checked={selected === value}
						onChange={onChange}
					/>
					{label}
				</label>
			))}
		</div>
	);
}

export function RadioGroupTitle({
	children,
	className,
}: {
	children: string;
	className?: string;
}) {
	return (
		<div className={className}>
			<Title variant="sm">{children}</Title>
		</div>
	);
}

export default RadioGroup;
