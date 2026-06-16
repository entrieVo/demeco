import GitHubIcon from "@/features/home/ui/icons/github-icon";
import { Mail } from "lucide-react";
import { memo } from "react";
import { twMerge } from "tailwind-merge";
import { Title } from "./title";

interface FooterProps {
	className?: string;
}

export const Footer = memo(function Footer({ className }: FooterProps) {
	return (
		<div
			className={twMerge(
				`bg-smoky-blue px-5 py-8 md:px-8
					flex flex-wrap gap-6 justify-around hyphens-auto
					mt-15`,
				className,
			)}>
			<FooterBlock title="Технический стек">
				<div className={`flex gap-2 flex-wrap`}>
					<TechItem>TypeScript</TechItem>
					<TechItem>React</TechItem>
					<TechItem>Vercel</TechItem>
				</div>
			</FooterBlock>
			<FooterBlock title="Тестовые данные" className={`hidden md:block`}>
				<div className={`flex gap-2 flex-wrap`}>
					<TechItem>Kodak Lossless</TechItem>
					<TechItem>LibriSpeech</TechItem>
					<TechItem>FreeSound</TechItem>
				</div>
			</FooterBlock>
			<FooterBlock title="Контакты">
				<div className={`flex flex-row gap-3 items-center mb-3`}>
					<Mail size={18} className={`text-light-blue`} />
					<div>avvasilets@edu.tversu.ru</div>
				</div>
				<div className={`flex flex-row gap-3 items-center mb-2`}>
					<GitHubIcon size={18} className={`text-light-blue`} />
					<div>github.com/entrieVo</div>
				</div>
			</FooterBlock>
		</div>
	);
});

interface FooterBlockProps extends FooterTitleProps {
	children: React.ReactNode;
}

function FooterBlock({ children, title, className }: FooterBlockProps) {
	return (
		<div
			className={twMerge(
				`text-sm text-gray-600 min-w-60 sm:w-1/3 md:w-2/7`,
				className,
			)}>
			<FooterTitle title={title} />
			{children}
		</div>
	);
}

interface FooterTitleProps {
	title: string;
	className?: string;
}

function FooterTitle({ title, className }: FooterTitleProps) {
	return (
		<Title
			className={twMerge(`font-bold text-foreground text-md mb-3`, className)}>
			{title}
		</Title>
	);
}

function TechItem({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={twMerge(
				`inline-block px-2 py-1 border-2 border-md-gray rounded-md`,
				className,
			)}>
			{children}
		</div>
	);
}
