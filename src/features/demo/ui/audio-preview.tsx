import { useMemo, useEffect, useState, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { AudioWaveform, AudioWaveformRef } from "./audiowaveform";
import {
	getDurationMs,
	useStereoToMono,
} from "../model/utils/audio-processing";
import { AudioControlPanel } from "./audio-control-panel";

interface AudioPreviewProps {
	blob: Blob;
	signal: Float32Array[];
	sampleRate: number;
	children?: React.ReactNode;
	className?: string;
}

export function AudioPreview({
	blob,
	signal,
	sampleRate,
	children,
	className,
}: AudioPreviewProps) {
	const monoSignal = useStereoToMono(signal);
	const durationMs = Math.floor(getDurationMs(monoSignal, sampleRate));

	const [startTimeMs, setStartTimeMs] = useState(0);
	const [endTimeMs, setEndTimeMs] = useState<number | undefined>(durationMs);
	const [showDownloadPanel, setShowDownloadPanel] = useState(false);
	const [showZoomPanel, setShowZoomPanel] = useState(false);

	const waveformRef = useRef<AudioWaveformRef>(null);

	useEffect(() => {
		// eslint-disable-next-line
		setStartTimeMs(0);
		setEndTimeMs(durationMs);
		setShowDownloadPanel(false);
		setShowZoomPanel(false);
	}, [durationMs]);

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
				"overflow-hidden flex flex-wrap gap-x-10 gap-y-3",
				className,
			)}>
			<div className={`flex-1`}>
				{children}
				<audio src={url} controls className={`w-full h-9 mt-3`} />
			</div>

			<div className={`relative flex-1/2 flex justify-center items-center`}>
				<div className={`sm:max-w-135`}>
					<AudioWaveform
						ref={waveformRef}
						data={monoSignal}
						sampleRate={sampleRate}
						startTimeMs={startTimeMs}
						endTimeMs={endTimeMs}
						controlPanel={
							<AudioControlPanel
								durationMs={durationMs}
								setStartTimeMs={setStartTimeMs}
								setEndTimeMs={setEndTimeMs}
								showDownloadPanel={showDownloadPanel}
								showZoomPanel={showZoomPanel}
								setShowDownloadPanel={setShowDownloadPanel}
								setShowZoomPanel={setShowZoomPanel}
								onExportPng={() => waveformRef.current?.exportToPNG()}
								onExportSvg={() => waveformRef.current?.exportToSVG()}
							/>
						}
					/>
				</div>
			</div>
		</div>
	);
}
