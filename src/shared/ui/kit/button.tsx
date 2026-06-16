import { twMerge } from "tailwind-merge";

interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
}

export function Button({ children, onClick, className }: ButtonProps) {
	return (
		<div className={className}>
			<button
				onClick={onClick}
				className={twMerge(
					`block w-40 bg-md-gray py-1 rounded-xl cursor-pointer`,
					className,
				)}>
				{children}
			</button>
		</div>
	);
}
