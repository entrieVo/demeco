import { useMemo, useEffect } from "react";
import { BrightnessHistogram } from "./brightness-hist";
import { twMerge } from "tailwind-merge";

interface ImagePreviewProps {
	blob: Blob;
	signal: Uint8ClampedArray;
	imageWidth: number;
	imageHeight: number;
	children?: React.ReactNode;
	className?: string;
}

export function ImagePreview({
	blob,
	signal,
	imageWidth,
	imageHeight,
	children,
	className,
}: ImagePreviewProps) {
	const url = useMemo(() => {
		if (!blob.type) return null;
		return URL.createObjectURL(blob);
	}, [blob]);

	useEffect(() => {
		return () => {
			if (url) {
				URL.revokeObjectURL(url);
			}
		};
	}, [url]);

	if (!url) return null;

	return (
		<div
			className={twMerge(
				`grid grid-cols-1 grid-rows-[auto_1.5fr_1fr]
				[grid-template-areas:'child'_'preview'_'hist']
				sm:grid-cols-2 sm:grid-rows-[auto_1fr] gap-3
				sm:[grid-template-areas:'child_preview'_'hist_preview']`,
				className,
			)}>
			{children}

			<div
				style={{ gridArea: "preview" }}
				className={`relative min-h-50 sm:mb-0
				sm:h-auto sm:min-h-0`}>
				<img
					src={url}
					alt="Preview"
					className={`pixelated rounded-lg object-contain h-full w-auto
						absolute inset-y-0 right-0 left-0 mx-auto
						sm:mb-0`}
				/>
			</div>

			<div className={`aspect-16/6`} style={{ gridArea: "hist" }}>
				<div className={`text-center`}>Гистограмма яркости</div>
				<BrightnessHistogram
					data={signal}
					imageWidth={imageWidth}
					imageHeight={imageHeight}
					className={`border border-gray-400 px-2 pt-2`}
				/>
			</div>
		</div>
	);
}
