interface SelectProps {
	options: Record<string, string>;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	className?: string;
}

export function Select({ options, value, onChange, className }: SelectProps) {
	return (
		<div className={className}>
			<select value={value} onChange={onChange}>
				{Object.entries(options).map(([k, v], i) => (
					<option key={i} value={k}>
						{v}
					</option>
				))}
			</select>
		</div>
	);
}
