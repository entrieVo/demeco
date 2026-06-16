import { Button } from "@/shared/ui/kit/button";
import { twMerge } from "tailwind-merge";

interface DemoButtonProps {
	onClick: () => void;
	children?: React.ReactNode;
	className?: string;
}

export function DemoButton({ children, onClick, className }: DemoButtonProps) {
	return (
		<Button
			onClick={onClick}
			className={twMerge(`mt-4 w-[90%] mx-auto`, className)}>
			{children}
		</Button>
	);
}
