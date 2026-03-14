import { AUTHOR, VERSION } from "@/features/constants";
import { NoiseType } from "@/features/constants";
import { Header } from "@/features/header/header";
import { Card } from "@/shared/ui/kit/card";
import { FileUploader } from "@/features/comparison/ui/file-uploader";
import { ComparisonParams } from "./comparison-params";
import { FilesShowcase } from "./files-showcase";
import { cn } from "@/shared/lib/css";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/kit/select";

interface ComparisonLayoutProps {
	audioRef: Blob | null;
	imageRef: Blob | null;
	noisyAudio: Blob | null;
	noisyImage: Blob | null;
	denoisedAudio: Blob | null;
	denoisedImage: Blob | null;
	noiseParams: { noiseVariance: number; blurStrength: number };
	selectedDenoise: string | null;
	selectedNoise: NoiseType;
	onNoiseSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	onDenoiseSelect: (value: string) => void;
	onNoiseApply: () => void;
	onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSigmaChange: (value: number[]) => void;
	onSigmaBlurChange: (value: number[]) => void;
}

export default function ComparisonLayout({
	audioRef,
	imageRef,
	noisyAudio,
	noisyImage,
	noiseParams,
	denoisedAudio,
	denoisedImage,
	onImageUpload,
	onAudioUpload,
	selectedNoise,
	selectedDenoise,
	onNoiseSelect,
	onDenoiseSelect,
	onNoiseApply,
	onSigmaChange,
	onSigmaBlurChange,
}: ComparisonLayoutProps) {
	return (
		<main
			className="min-h-screen flex flex-col relative gap-(--card-gap)
		m-3 sm:m-10 hyphens-auto">
			<Header
				page="audioImage"
				info={`v ${VERSION}`}
				variant="invert"
				bubbleText={`Автор: ${AUTHOR}`}
			/>
			<section className="lg:gap-(--card-gap)">
				<Card
					className="pt-23 px-6 gap-4
					sm:px-10 sm:pb-10
					lg:px-30 lg:gap-6 pb-6 md:px-20">
					<h1
						className="text-lg font-bold mb-0
						sm:mb-4 sm:mt-5 sm:text-3xl
						md:text-4xl
						lg:mb-7">
						Сравнение аудио- и видеосигналов
					</h1>
					<h2 className="text-lg sm:text-3xl md:text-3xl sm:mb-3 lg:mb-4">
						Загрузка файлов
					</h2>
					<div
						className={cn(
							"flex flex-col xl:flex-row gap-8 xl:gap-20",
							!audioRef && !imageRef && "justify-center"
						)}>
						<div
							className="flex flex-col gap-4 md:flex-row md:justify-around xl:justify-center
						md:gap-20 xl:flex-col xl:gap-10">
							<FileUploader fileType="IMAGE" onUpload={onImageUpload} />
							<div className="w-full h-px bg-background md:w-px md:h-35 xl:w-full xl:h-px" />
							<FileUploader fileType="AUDIO" onUpload={onAudioUpload} />
						</div>
						<FilesShowcase
							imageRef={imageRef}
							audioRef={audioRef}
							variant="combine"
							className="self-center"
						/>
					</div>
				</Card>
			</section>
			<ComparisonParams
				selectedNoise={selectedNoise}
				onNoiseSelect={onNoiseSelect}
				onNoiseApply={onNoiseApply}
				noiseParams={noiseParams}
				onSigmaChange={onSigmaChange}
				onSigmaBlurChange={onSigmaBlurChange}
				className="md:px-20"
			/>
			<FilesShowcase
				audioRef={noisyAudio}
				imageRef={noisyImage}
				audioLabel={<p>Зашумлённое аудио</p>}
				imageLabel={<p>Зашумлённое изображение</p>}
				className="self-center"
			/>
			{noisyAudio && noisyImage && (
				<Card>
					<h3>Фильтр шумоподавления</h3>
					<Select onValueChange={onDenoiseSelect}>
						<SelectTrigger className="w-full max-w-48">
							<SelectValue placeholder={selectedDenoise} />
						</SelectTrigger>
						<SelectContent>
							{Object.entries({
								bayesian: "bayesian",
								wiener: "wiener",
								hmm: "hmm",
							}).map(([key, label]) => (
								<SelectItem key={key} value={label}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Card>
			)}
			<FilesShowcase
				audioRef={denoisedAudio}
				imageRef={denoisedImage}
				audioLabel={<p>Очищенное аудио</p>}
				imageLabel={<p>Очищенное изображение</p>}
				className="self-center"
			/>
		</main>
	);
}
