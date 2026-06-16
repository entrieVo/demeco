"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/shared/ui/kit/header";
import { Footer } from "@/shared/ui/kit/footer";
import { UploadButton } from "@/features/demo/ui/upload-button";
import { useFile } from "@/features/demo/model/processing/use-file";
import { FileInfo } from "@/features/demo/ui/file-info";
import { useDemoData } from "@/features/demo/model/processing/use-demo-data";
import {
	AudiobufferData,
	FileType,
	NoiseType,
} from "@/features/demo/model/utils/types";
import { SignalPreview } from "@/features/demo/ui/signal-preview";
import { useDemoParams } from "@/features/demo/model/processing/use-demo-params";
import { ParamsSection } from "@/features/demo/ui/params-section";
import { MetricsTable } from "@/features/demo/ui/metrics-table";
import { TemplatePanel } from "@/features/demo/ui/template-panel";
import { useState } from "react";
import { Divider } from "@/shared/ui/kit/divider";
import { DenoisedShowcase } from "@/features/demo/ui/denoised-showcase";
import { DemoButton } from "@/features/demo/ui/demo-btn";
import { Title } from "@/shared/ui/kit/title";

export default function DemoPage() {
	return (
		<Suspense fallback={<div>Загрузка...</div>}>
			<RefreshWrapper />
		</Suspense>
	);
}

function RefreshWrapper() {
	const searchParams = useSearchParams();
	const refreshKey = searchParams.get("refresh") || "";

	return <DemoContent key={refreshKey} />;
}

function DemoContent() {
	const { file, setFile } = useFile();
	const {
		noise,
		strength,
		blur,
		setNoise,
		setStrength,
		setBlur,
		controlParams,
	} = useDemoParams();
	const {
		info: fileInfo,
		type,
		original,
		noised,
		denoised,
		metrics,
		onNoise,
		onDenoise,
	} = useDemoData(file, noise as NoiseType, strength, blur);

	const [stage, setStage] = useState<
		"upload" | "noise" | "denoise" | "experiment"
	>("upload");
	const [isLoading, setIsLoading] = useState(false);

	return (
		<div className={`flex flex-col min-h-screen`}>
			<Header />
			<main className="flex flex-col flex-1 px-5 md:px-8">
				<Title variant="xl" className={`mb-6`}>
					Интерактивная демонстрация
				</Title>
				{stage === "upload" && (
					<div className={`flex flex-col gap-3 sm:grid sm:grid-cols-2 mb-5`}>
						<UploadButton setFile={setFile} />
						<TemplatePanel onTemplateSelect={setFile} />
					</div>
				)}

				{file && original && (
					<div>
						<SignalPreview type={type as FileType} signal={original}>
							<FileInfo info={fileInfo} style={{ gridArea: "child" }} />
						</SignalPreview>
						{stage === "upload" && (
							<DemoButton onClick={() => setStage("noise")}>
								Перейти к зашумлению
							</DemoButton>
						)}
					</div>
				)}

				{stage !== "upload" && (
					<div>
						<SignalPreview type={type as NoiseType} signal={noised} divider>
							<ParamsSection
								title="Зашумление"
								noise={noise as NoiseType}
								strength={strength}
								blur={blur}
								noiseControl={controlParams.noise}
								setNoise={setNoise}
								setStrength={setStrength}
								setBlur={setBlur}
							/>
						</SignalPreview>

						{stage === "noise" && (
							<DemoButton
								onClick={() => {
									setIsLoading(true);

									setTimeout(() => {
										onNoise();
										setIsLoading(false);
										setStage("denoise");
									}, 0);
								}}>
								Наложить шум
							</DemoButton>
						)}
						{(stage === "denoise" || stage === "experiment") && !isLoading && (
							<DemoButton
								onClick={() => {
									setIsLoading(true);

									setTimeout(() => {
										let signal: AudiobufferData | ImageData | null;
										if (stage === "experiment") signal = onNoise();
										else {
											signal = noised;
											setStage("experiment");
										}

										if (signal) onDenoise(signal);
										setIsLoading(false);
									}, 0);
								}}>
								Выполнить шумоподавление
							</DemoButton>
						)}
					</div>
				)}

				{metrics && !isLoading && (
					<div>
						<Divider />
						<MetricsTable
							metrics={metrics}
							type={type as FileType}
							className={`w-full mb-5`}
						/>
						<DenoisedShowcase type={type as FileType} denoised={denoised} />
					</div>
				)}

				{isLoading && (
					<div className={`w-full`}>
						<Divider />
						<div className={`text-blue font-semibold text-center text-xl`}>
							Обработка...
						</div>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}
