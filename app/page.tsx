"use client";

import { CardsShowcase, ShowcaseCard } from "@/features/home/ui/cards-showcase";
import HomeShowcase from "@/features/home/ui/home-showcase";
import GitHubIcon from "@/features/home/ui/icons/github-icon";
import { Header } from "@/shared/ui/kit/header";
import clsx from "clsx";
import {
	AudioLines,
	BookOpen,
	ChartColumnBig,
	CirclePlay,
	ClipboardList,
	FileText,
	Info,
	NotepadText,
	ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
	const [isModalOpen, setIsModalOpen] = useState<boolean>(true);

	return (
		<div className={clsx(isModalOpen && "overflow-hidden h-screen")}>
			{isModalOpen && (
				<div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/5 backdrop-blur-[3px]">
					<div className="bg-background rounded-lg p-6 shadow-xl max-w-md w-full mx-4 flex flex-col items-center">
						<h2 className="text-xl font-bold mb-4 text-center">
							Сайт находится на стадии разработки
						</h2>
						<div className={`relative size-50`}>
							<Image
								src="/in-progress-icon.png"
								alt="in-progress"
								fill
								className={`object-contain`}
								sizes="100vw"
							/>
						</div>
						<button
							className="text-gray-300 lowercase underline text-sm text-right block w-full"
							onClick={() => {
								setIsModalOpen(false);
							}}>
							Всё равно хочу взглянуть
						</button>
					</div>
				</div>
			)}

			<Header />
			<main className="flex flex-col gap-15 px-5 md:px-8 last:mb-20">
				<HomeShowcase
					className={`-mx-5 md:-mx-8`}
					label={
						<div
							className={`inline-block rounded-md py-0.5 px-3 mb-4
							border-2 border-[rgba(var(--light-blue),.3)]
							text-light-blue font-bold text-center`}>
							Научный проект
						</div>
					}
					title={`Сравнительный анализ вероятностных методов подавления шума в
									 аудио- и видеосигналах`}
					description={`Исследование и сравнение эффективности 
												фильтров Винера, Байеса и HMM в задачах подавления
												шума в одномерных (аудио) и двумерных (изображения) 
												сигналах в рамках кросс-доменного протокола.`}
					buttons={[
						{ icon: <FileText size={18} />, label: "Скачать статью (PDF)" },
						{ icon: <GitHubIcon size={20} />, label: "Код на GitHub" },
						{ icon: <BookOpen size={18} />, label: "Текст ВКР" },
					]}
				/>
				<CardsShowcase title="Ключевые особенности проекта">
					<ShowcaseCard
						icon={<AudioLines className={`size-full`} />}
						title="Кросс-доменный подход"
						description={`Единый протокол для аудио (1D) и изображений (2D) 
							позволяет объективно сравнивать методы`}
					/>
					<ShowcaseCard
						icon={<ChartColumnBig className={`size-full`} />}
						title="Сравнение трёх методов"
						description={`Винер, Байесовский фильтр и скрытые
							марковские модели (HMM) в одинаковых условиях`}
					/>
					<ShowcaseCard
						icon={<ChartColumnBig className={`size-full`} />}
						title="Количественная оценка"
						description={`Используются стандартизированные метрики
							качества: PSNR, SSIM, SNR, STOI, PESQ`}
					/>
					<ShowcaseCard
						icon={<ShieldCheck className={`size-full`} />}
						title="Научная обоснованность"
						description={`Результаты подтверждены экспериментами`}
					/>
				</CardsShowcase>
				<CardsShowcase title="Что включает проект">
					<ShowcaseCard
						variant="border"
						icon={<CirclePlay className={`size-full`} />}
						title="Интерактивное демо"
						description={`Попробуйте фильтры на своих данных:
							настройте шум, выберите метод и оцените результат в
							рельном времени`}
						link={{ text: "Перейти к демо", href: "#" }}
					/>
					<ShowcaseCard
						variant="border"
						icon={<ClipboardList className={`size-full`} />}
						title="Результаты исследований"
						description={`Графики, таблицы и сравнение эффективности
							фильтров в зависимости от типа и уровня шума для аудио и
							изобаржений`}
						link={{ text: "Смотреть результаты", href: "#" }}
					/>
					<ShowcaseCard
						variant="border"
						icon={<NotepadText className={`size-full`} />}
						title="Методология"
						description={`Описание методов, метрик и протокола тестирования.
							Математические модели и формулы`}
						link={{ text: "Читать методологию", href: "#" }}
					/>
					<ShowcaseCard
						variant="border"
						icon={<Info className={`size-full`} />}
						title="О проекте"
						description={`Цели, задачи, научная новизна и значимость исследования`}
						link={{ text: "Узнать больше", href: "#" }}
					/>
				</CardsShowcase>
			</main>
		</div>
	);
}
