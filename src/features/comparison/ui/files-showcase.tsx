import { cn } from "@/shared/lib/css";
import { BlobAudio } from "./blob-audio";
import { BlobImage } from "./blob-image";

interface FilesShowcaseProps {
	audioRef: Blob | null;
	imageRef: Blob | null;
	audioLabel?: React.ReactNode;
	imageLabel?: React.ReactNode;
	variant?: "combine" | "separate";
	className?: string;
}

export function FilesShowcase({
	audioRef,
	imageRef,
	audioLabel,
	imageLabel,
	variant = "separate",
	className,
}: FilesShowcaseProps) {
	if (!audioRef && !imageRef) return;
	const separatedBlocks = variant === "separate";

	return (
		<div
			className={cn(
				"size-10/12 flex flex-col \
				sm:flex-row-reverse sm:size-full",
				audioRef &&
					!separatedBlocks &&
					"bg-background rounded-4xl\
				sm:rounded-[35px]",
				separatedBlocks && "gap-(--card-gap) size-full",
				(!audioRef || !imageRef) && "justify-center",
				className
			)}>
			{imageRef && (
				<div
					className={cn(
						"size-full overflow-hidden rounded-4xl \
					flex flex-col	md:flex-1/2",
						separatedBlocks && "bg-primary",
						!separatedBlocks && "max-h-100 max-w-100"
					)}>
					{imageLabel && (
						<div className="w-1/2 sm:w-full lg:w-1/2 mx-5 my-3 sm:text-2xl sm:py-5 lg:mx-6 lg:my-4 xl:text-3xl xl:mx-10 xl:my-8">
							{imageLabel}
						</div>
					)}
					<BlobImage blob={imageRef} className="rounded-4xl" />
				</div>
			)}
			{audioRef && (
				<div
					className={cn(
						"flex flex-col w-full justify-center rounded-4xl py-3",
						separatedBlocks && "bg-primary",
						audioLabel && "justify-between",
						audioLabel && "pt-0 px-0"
					)}>
					{audioLabel && (
						<div className="mx-5 my-3 w-1/2 sm:w-full md:w-1/2 sm:text-2xl sm:py-5 md:p-5 lg:mx-6 lg:my-4 xl:text-3xl xl:mx-10 xl:my-8">
							{audioLabel}
						</div>
					)}
					<BlobAudio blob={audioRef} className="self-center px-5" />
				</div>
			)}
		</div>
	);
}
