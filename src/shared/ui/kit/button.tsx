import clsx from "clsx";

interface ButtonProps {
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	icon?: React.ReactNode;
	label: string;
	className?: string;
}

export default function Button({
	icon,
	label,
	onClick,
	className,
}: ButtonProps) {
	return (
		<div className={clsx("w-full md:w-auto", className)}>
			<button
				onClick={onClick}
				className={`px-3 py-2 rounded-md w-full cursor-pointer
					flex flex-row justify-center items-center
					border-3 border-[rgba(var(--blue),.2)]
					font-semibold text-blue`}>
				<div className={`pr-3 max-h-5 max-w-8`}>{icon && icon}</div>
				{label}
			</button>
		</div>
	);
}
