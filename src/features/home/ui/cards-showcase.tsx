import clsx from "clsx";
import { MoveRight } from "lucide-react";
import Link from "next/link";

interface CardsShowcaseProps {
	title: string;
	children: React.ReactNode;
	className?: string;
}

export function CardsShowcase({
	title,
	children,
	className,
}: CardsShowcaseProps) {
	return (
		<div className={className}>
			<div className={`flex flex-col gap-5 items-center`}>
				<h2
					className={`font-bold text-xl text-center relative mb-8
						after:block after:absolute after:transform-[translate(-50%,-50%)]
						after:-bottom-5 after:left-[50%]
						after:w-2/12 after:h-0.5 after:bg-light-blue after:rounded-full`}>
					{title}
				</h2>
				<div className="flex gap-3 md:gap-6 flex-wrap justify-center lg:flex-nowrap">
					{children}
				</div>
			</div>
		</div>
	);
}

interface ShowcaseCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	link?: { text: string; href: string };
	variant?: "plain" | "border";
	className?: string;
}

export function ShowcaseCard({
	icon,
	title,
	description,
	link,
	className,
	variant = "plain",
}: ShowcaseCardProps) {
	return (
		<div className={clsx("lg:w-1/4", className)}>
			<div
				className={clsx(
					`flex flex-col hyphens-auto xl:w-auto h-full`,
					{
						plain: "items-center text-center w-30 md:w-50",
						border: `bg-smoky-blue border-2 border-soft-gray rounded-md
										items-center md:items-stretch gap-3 md:gap-0
										flex-row md:flex-col p-4 md:w-70 lg:w-full`,
					}[variant],
				)}>
				<div
					className={clsx(
						`text-light-blue size-10 md:mb-4`,
						variant === "plain" && "mb-4",
					)}>
					{icon}
				</div>
				<h6
					className={clsx(
						`font-bold`,
						variant === "border" && "hidden md:block",
					)}>
					{title}
				</h6>
				<p className={`text-gray-500 mt-2 hidden md:block mb-7`}>
					{description}
				</p>
				{link && (
					<Link
						href={link.href}
						className={`text-light-blue font-bold
						md:mt-auto md:self-start`}>
						{link.text} <MoveRight className={`hidden md:inline`} size={17} />
					</Link>
				)}
			</div>
		</div>
	);
}
