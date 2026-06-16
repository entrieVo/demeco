import { twMerge } from "tailwind-merge";
import {
	DenoiseType,
	AudiobufferData,
	FileType,
	DENOISE_TYPES,
} from "../model/utils/types";
import { SignalPreview } from "./signal-preview";
import { Title } from "@/shared/ui/kit/title";

interface DenoisedShowcaseProps {
	type: FileType;
	denoised: Record<DenoiseType, AudiobufferData | ImageData> | null;
	className?: string;
}

export function DenoisedShowcase({
	type,
	denoised,
	className,
}: DenoisedShowcaseProps) {
	if (!denoised) return;

	return (
		<div
			className={twMerge(
				`flex flex-col gap-5`,
				type === "audio" ? "sm:flex-row" : "",
				className,
			)}>
			{Object.entries(denoised).map(([filter, signal]) => (
				<div key={filter}>
					<SignalPreview
						signal={signal}
						type={type}
						className={type === "audio" ? `flex-col flex-1/3` : ``}>
						<Title
							variant="sm"
							className={`min-h-10 flex justify-center items-center text-center`}>
							{DENOISE_TYPES[filter as DenoiseType]}
						</Title>
					</SignalPreview>
				</div>
			))}
		</div>
	);
}
