import clsx from "clsx";
import { BookOpen, Download, FileText } from "lucide-react";
import Image from "next/image";
import GitHubIcon from "./icons/github-icon";
import Link from "next/link";
import { Title } from "@/shared/ui/kit/title";

interface IntroProps {
	className?: string;
}

export function Intro({ className }: IntroProps) {
	return (
		<section className={className}>
			<div
				className={`px-5 py-8 md:px-8
				bg-smoky-blue border-b-2 border-b-soft-gray`}>
				<div
					className={`inline-block rounded-md py-0.5 px-3 mb-4
							border-2 border-[rgba(var(--light-blue),.3)]
							text-light-blue font-bold text-center`}>
					Научный проект
				</div>
				<div className={`flex mb-8`}>
					<div className={`md:flex-1`}>
						<Title variant="xl" className={`max-w-115`}>
							Сравнительный анализ вероятностных методов подавления шума в
							аудио- и видеосигналах
						</Title>
						<div className={`text-gray-600`}>
							Исследование и сравнение эффективности фильтров Винера, Байеса и
							HMM в задачах подавления шума в одномерных (аудио) и двумерных
							(изображения) сигналах в рамках кросс-доменного протокола.
						</div>
					</div>
					<div
						className={`hidden md:block
						flex-1 relative min-h-0 overflow-hidden ml-9`}>
						<Image
							src="/logo.png"
							alt="Описание"
							sizes="100vw"
							fill
							className={`object-contain`}
						/>
					</div>
				</div>
				<div className={`flex flex-col gap-2 md:flex-row`}>
					<IntroLink
						href="/files/article.pdf"
						download="article.pdf"
						icon={<FileText className="size-full" />}
						label="Скачать статью (PDF)"
					/>
					<IntroLink
						href="https://github.com/entrieVo/demeco"
						icon={<GitHubIcon size={20} />}
						label="Код на GitHub"
					/>
					<IntroLink
						href="/files/vkr.pdf"
						icon={<BookOpen className="size-full" />}
						label="Текст ВКР"
					/>
				</div>
			</div>
		</section>
	);
}

interface IntroLinkProps {
	label: string;
	href: string;
	download?: string;
	icon?: React.ReactNode;
	className?: string;
}

function IntroLink({ icon, label, href, download, className }: IntroLinkProps) {
	return (
		<div className={clsx("w-full md:w-auto", className)}>
			<Link
				href={href}
				download={download}
				className={`px-3 py-2 rounded-md w-full cursor-pointer
					flex flex-row justify-center items-center
					border-3 border-[rgba(var(--blue),.2)]
					font-semibold text-blue`}>
				{icon && <div className={`pr-3 max-h-5 max-w-8`}>{icon}</div>}
				{label}
			</Link>
		</div>
	);
}
