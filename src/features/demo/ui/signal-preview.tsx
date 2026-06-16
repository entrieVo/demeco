import { usePreviewData } from "../model/processing/use-preview-data";
import { AudiobufferData, FileType } from "../model/utils/types";
import { AudioPreview } from "./audio-preview";
import { ImagePreview } from "./image-preview";
import { Divider } from "@/shared/ui/kit/divider";

interface SignalPreviewProps {
	type: FileType;
	signal: AudiobufferData | ImageData | null;
	divider?: boolean;
	children?: React.ReactNode;
	className?: string;
}

export function SignalPreview({
	type,
	signal,
	divider = false,
	children,
	className,
}: SignalPreviewProps) {
	const { blob } = usePreviewData(type as FileType, signal);

	return (
		<div>
			{divider && <Divider />}
			{!signal && <>{children}</>}
			{signal && type === "audio" ? (
				<AudioPreview
					blob={blob}
					className={className}
					signal={(signal as AudiobufferData)?.data}
					sampleRate={(signal as AudiobufferData)?.sampleRate}>
					{children}
				</AudioPreview>
			) : (
				<ImagePreview
					blob={blob}
					className={className}
					signal={(signal as ImageData)?.data}
					imageWidth={(signal as ImageData)?.width}
					imageHeight={(signal as ImageData)?.height}>
					{children}
				</ImagePreview>
			)}
		</div>
	);
}
