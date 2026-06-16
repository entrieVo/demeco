import { Title } from "@/shared/ui/kit/title";
import clsx from "clsx";
import { AudioLines, ChartColumnBig, Sigma, ShieldCheck } from "lucide-react";

interface ImprovementsProps {
	className?: string;
}

export function Improvements({ className }: ImprovementsProps) {
	return (
		<section className={className}>
			<div className={`flex flex-col gap-5 items-center`}>
				<Title variant="lg">Ключевые особенности проекта</Title>
				<div className="flex gap-3 md:gap-6 flex-wrap justify-around lg:flex-nowrap">
					<ImprovmentsCard
						icon={<AudioLines className={`size-full`} />}
						title="Кросс-доменный подход"
						description={`Единый протокол для аудио (1D) и изображений (2D) 
							позволяет объективно сравнивать методы`}
					/>
					<ImprovmentsCard
						icon={<ChartColumnBig className={`size-full`} />}
						title="Сравнение трёх методов"
						description={`Винер, Байесовский фильтр и скрытые
							марковские модели (HMM) в одинаковых условиях`}
					/>
					<ImprovmentsCard
						icon={<Sigma className={`size-full`} />}
						title="Количественная оценка"
						description={`Используются стандартизированные метрики
							качества: PSNR, SSIM, SNR, STOI, PESQ`}
					/>
					<ImprovmentsCard
						icon={<ShieldCheck className={`size-full`} />}
						title="Научная обоснованность"
						description={`Результаты подтверждены экспериментами`}
					/>
				</div>
			</div>
		</section>
	);
}

interface ImprovmentsCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	className?: string;
}

function ImprovmentsCard({
	icon,
	title,
	description,
	className,
}: ImprovmentsCardProps) {
	return (
		<div className={clsx("w-30 md:w-50 lg:w-1/4 max-w-80", className)}>
			<div
				className={`flex flex-col xl:w-auto h-full items-center
				text-center hyphens-auto`}>
				<div className="text-light-blue size-10 mb-4">{icon}</div>
				<Title variant="sm">{title}</Title>
				<p className={`text-gray-500 mt-2 hidden md:block`}>{description}</p>
			</div>
		</div>
	);
}
