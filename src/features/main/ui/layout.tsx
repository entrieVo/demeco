"use client";

import { VERSION } from "@/features/constants";
import { Header } from "@/features/header/header";
import { Card } from "@/shared/ui/kit/card";
import { ProgressInfo } from "./progress-info";
import Link from "next/link";

export function MainLayout() {
	return (
		<>
			<main className="min-h-screen text-sm sm:text-lg xl:text-xl flex flex-col relative m-10 gap-(--card-gap)">
				<Header
					page="main"
					info={`v ${VERSION}`}
					bubbleText="Автор: Василец Анастасия Вячеславовна"
					variant="invert"
				/>
				<Card className="pt-23 px-6 sm:pt-25 sm:px-15 lg:pt-35 lg:px-30 hyphens-auto">
					<h1 className="sm:text-lg font-bold md:text-xl lg:text-2xl lg:mb-2">
						Сравнительный анализ вероятностных методов подавления шума в аудио-
						и видеосигналах
					</h1>
					<p className="text-justify">
						Этот сайт представляет собой интерактивную платформу для
						исследования и визуализации методов шумоподавления в аудио- и
						видеосигналах. Проект разработан в рамках магистерской диссертации,
						посвящённой сравнительному анализу эффективности вероятностных
						подходов к восстановлению сигналов при различных типах искажений.
					</p>
					<ProgressInfo
						title="Реализовано"
						list={{
							"Генерация синтетических шумов": [
								"Аудио: гауссов (белый), цветной (низкочастотный), импульсный(«щелчки»);",
								"Изображения: гауссов, импульсный («соль и перец»).",
							],
						}}
					/>
					<ProgressInfo
						title="Планы на будущие версии"
						list={{
							"Реализация трёх вероятностных методов восстановления": [
								"Фильтр Винера,",
								"Байесовская MAP-оценка,",
								"Модель на основе скрытых марковских процессов (HMM).",
							],
							"Количественная оценка качества восстановления": [
								"Для аудио — SNR,",
								"Для изображений — PSNR и SSIM.",
							],
							"Сравнительный анализ эффективности методов в зависимости от типа сигнала и характера шума":
								[],
							"Поддержка видеопоследовательностей (покадровая обработка)": [],
						}}
					/>
					<Link
						href="comparison"
						className="block mx-auto bg-background text-primary rounded-full px-5 py-2 sm:mt-10 text-center">
						Перейти к зашумлению
					</Link>
				</Card>
			</main>
		</>
	);
}
