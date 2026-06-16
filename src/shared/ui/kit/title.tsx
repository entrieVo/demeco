import { twMerge } from "tailwind-merge";

interface HlgProps {
	children: string;
	variant?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

export function Title({ children, variant = "sm", className }: HlgProps) {
	return {
		sm: (
			<h6 className={twMerge(`font-semibold mb-1`, className)}>{children}</h6>
		),
		md: (
			<h3 className={twMerge(`font-bold text-xl mb-2`, className)}>
				{children}
			</h3>
		),
		lg: (
			<h2
				className={twMerge(
					`relative font-bold text-xl text-center mb-8 
						after:block after:absolute after:transform-[translate(-50%,-50%)]
						after:-bottom-5 after:left-[50%]
						after:w-2/12 after:h-0.5 after:bg-light-blue after:rounded-full`,
					className,
				)}>
				{children}
			</h2>
		),
		xl: (
			<h1 className={twMerge(`text-2xl font-bold mb-3`, className)}>
				{children}
			</h1>
		),
	}[variant];
}
