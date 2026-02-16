import { cn } from "@/shared/lib/css";
import { Navbar } from "@/features/header/navbar";
import { LucideProps } from "lucide-react";
import { useState } from "react";

export function Header({
	page,
	info,
	bubbleText,
	variant = "clear",
}: {
	page: "main" | "audioImage";
	info?: string | null;
	bubbleText?: string;
	variant?: "clear" | "invert" | "block-primary" | "block-accent";
}) {
	const blockStyle =
		variant === "block-primary"
			? "bg-primary"
			: variant === "block-accent"
			? "bg-accent"
			: "";

	return (
		<header className="absolute top-0 w-full flex">
			<div
				className={cn(
					"relative pt-3 pb-6  max-w-[50%] bg-background",
					variant === "invert" && "tab-invert"
				)}>
				<Navbar page={page} />
			</div>

			<div
				className={cn(
					"flex items-center justify-between w-full pb-2 rounded-full",
					blockStyle
				)}>
				<p className="text-background ml-7 whitespace-nowrap">{info}</p>
				{bubbleText && (
					<div
						className="hidden lg:block bg-background rounded-full text-primary
						 text-center px-2 py-2 mr-5">
						<p className={cn("lg:px-4")}>{bubbleText}</p>
					</div>
				)}
			</div>
		</header>
	);
}
