"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

interface EquationProps {
	formula: string;
	variant?: "inline" | "block";
	displayStyle?: boolean;
	className?: string;
}

export default function Equation({
	formula,
	variant = "inline",
	displayStyle = false,
	className,
}: EquationProps) {
	const containerRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		katex.render(formula, containerRef.current as HTMLInputElement);
	}, [formula]);

	if (displayStyle) formula = `\\displaystyle ${formula}`;

	return (
		<span
			ref={containerRef}
			className={twMerge(
				"inline-block",
				variant === "block" ? `text-center my-3 w-full` : "",
				className,
			)}
		/>
	);
}
