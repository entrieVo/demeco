import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/lib/css";

export function IconLink({
	Icon,
	pageName,
	href,
	onClick,
	onMouseEnter,
	onMouseLeave,
}: {
	Icon: ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
	>;
	pageName: string;
	href?: string;
	onClick?: () => void;
	onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
	onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
	variant?: "accent" | "background";
}) {
	const content = (
		<>
			<div
				className="min-w-8 min-h-8 bg-accent rounded-sm mr-4
				flex items-center justify-center">
				<Icon size={24} color="var(--background)" strokeWidth={1.8} />
			</div>
			<div
				className={cn(
					href ? "" : "hidden sm:block pr-30",
					"w-full overflow-hidden "
				)}>
				<div
					className={cn(
						"whitespace-nowrap",
						href ? "text-xl" : "text-2xl",
						href ? "text-background" : "text-primary"
					)}>
					{pageName}
				</div>
			</div>
		</>
	);

	if (href)
		return (
			<Link href={href} className="flex items-center cursor-pointer px-">
				{content}
			</Link>
		);

	return (
		<button
			className="flex items-center cursor-pointer uppercase
			ml-5 max-w-full overflow-hidden"
			onMouseEnter={onMouseEnter && onMouseEnter}
			onMouseLeave={onMouseLeave && onMouseLeave}
			onClick={onClick && onClick}>
			{content}
		</button>
	);
}
