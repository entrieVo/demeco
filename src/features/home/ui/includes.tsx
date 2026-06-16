import { Title } from "@/shared/ui/kit/title";
import clsx from "clsx";
import Link from "next/link";
import {
	CirclePlay,
	ClipboardList,
	NotepadText,
	Info,
	MoveRight,
} from "lucide-react";

interface IncludesProps {
	className?: string;
}

export function Includes({ className }: IncludesProps) {
	return (
		<section className={className}>
			<div className={`flex flex-col gap-5 items-center`}>
				<Title variant="lg">Что включает проект</Title>
				<div className="flex gap-3 md:gap-6 flex-wrap justify-center lg:flex-nowrap">
					<IncludesCard
						icon={<CirclePlay className={`size-full`} />}
						title="Интерактивное демо"
						description={`Попробуйте фильтры на своих данных:
							настройте шум, выберите метод и оцените результат в
							рельном времени`}
						link={{ text: "Перейти к демо", href: "/demo" }}
					/>
					<IncludesCard
						icon={<ClipboardList className={`size-full`} />}
						title="Результаты исследований"
						description={`Графики, таблицы и сравнение эффективности
							фильтров в зависимости от типа и уровня шума для аудио и
							изобаржений`}
						link={{ text: "Смотреть результаты", href: "/results" }}
					/>
					<IncludesCard
						icon={<NotepadText className={`size-full`} />}
						title="Методология"
						description={`Описание методов, метрик и протокола тестирования.
							Математические модели и формулы`}
						link={{ text: "Читать методологию", href: "/methods" }}
					/>
					<IncludesCard
						icon={<Info className={`size-full`} />}
						title="О проекте"
						description={`Цели, задачи, научная новизна и значимость исследования`}
						link={{ text: "Узнать больше", href: "/about" }}
					/>
				</div>
			</div>
		</section>
	);
}

interface IncludesCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	link: { text: string; href: string };
	className?: string;
}

function IncludesCard({
	icon,
	title,
	description,
	link,
	className,
}: IncludesCardProps) {
	return (
		<div className={clsx("w-full max-w-80 sm:w-3/7 lg:w-1/4", className)}>
			<div
				className={`flex flex-row hyphens-auto size-full justify-center
										bg-smoky-blue border-2 border-soft-gray rounded-md
										items-center p-4
										md:flex-col md:items-stretch gap-3 md:gap-0`}>
				<div className="text-light-blue size-10 md:mb-4">{icon}</div>
				<Title className={`font-bold hidden md:block mb-0`}>{title}</Title>
				<p className={`text-gray-500 mt-2 hidden md:block mb-7`}>
					{description}
				</p>
				<Link
					href={link.href}
					className={`text-light-blue font-bold
						md:mt-auto md:self-start`}>
					{link.text} <MoveRight className={`hidden md:inline`} size={17} />
				</Link>
			</div>
		</div>
	);
}
