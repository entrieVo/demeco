import { twMerge } from "tailwind-merge";

interface DividerProps {
	className?: string;
}

export function Divider({ className }: DividerProps) {
	return (
		<div className={twMerge("my-5", className)}>
			<div className={`h-px w-full bg-md-gray rounded-2xl`}></div>
		</div>
	);
}
