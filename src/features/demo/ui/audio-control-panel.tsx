import { Search, Download, Check, Ban } from "lucide-react";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

interface AudioControlPanelProps {
	setStartTimeMs: (time: number) => void;
	setEndTimeMs: (time: number) => void;
	onExportPng: () => void;
	onExportSvg: () => void;
	showDownloadPanel: boolean;
	showZoomPanel: boolean;
	setShowDownloadPanel: (show: boolean) => void;
	setShowZoomPanel: (show: boolean) => void;
	durationMs: number;
	className?: string;
}

export function AudioControlPanel({
	setStartTimeMs,
	setEndTimeMs,
	onExportPng,
	onExportSvg,
	showDownloadPanel,
	showZoomPanel,
	setShowDownloadPanel,
	setShowZoomPanel,
	durationMs,
	className,
}: AudioControlPanelProps) {
	const startMsRef = useRef<HTMLInputElement | null>(null);
	const endMsRef = useRef<HTMLInputElement | null>(null);

	const applyZoom = () => {
		if (!startMsRef?.current) return;
		let start = +startMsRef.current.value;
		if (!endMsRef?.current) return;
		let end = +endMsRef.current.value;

		if (start >= end) return;

		if (start < 0) start = 0;
		if (end > durationMs) end = durationMs;

		setStartTimeMs(+startMsRef.current.value);
		setEndTimeMs(+endMsRef.current.value);
	};

	const rejectZoom = () => {
		setStartTimeMs(0);
		setEndTimeMs(durationMs);

		if (startMsRef.current) startMsRef.current.value = "";
		if (endMsRef.current) endMsRef.current.value = "";
	};

	return (
		<div
			className={twMerge(
				`absolute top-1 right-1 flex flex-col gap-1`,
				className,
			)}>
			<div className={`flex gap-1 justify-end`}>
				<button
					className={`size-[7vw] max-w-7 max-h-7 bg-green text-soft-gray rounded-sm p-0.5`}
					onClick={() => {
						setShowZoomPanel(!showZoomPanel);
						setShowDownloadPanel(false);
					}}>
					<Search className={`size-full`} />
				</button>
				<button
					className={`size-[7vw] max-w-7 max-h-7 bg-sky-blue text-soft-gray rounded-sm p-0.5`}
					onClick={() => {
						setShowDownloadPanel(!showDownloadPanel);
						setShowZoomPanel(false);
					}}>
					<Download className={`size-full`} />
				</button>
			</div>

			<div className={`relative`}>
				{showDownloadPanel && (
					<div className={`absolute top-0 right-0 flex`}>
						<button
							className={`bg-sky-blue px-1 rounded-sm text-soft-gray mr-1`}
							onClick={() => {
								onExportPng();
								setShowDownloadPanel(false);
							}}>
							PNG
						</button>
						<button
							className={`bg-sky-blue px-1 rounded-sm text-soft-gray`}
							onClick={() => {
								onExportSvg();
								setShowDownloadPanel(false);
							}}>
							SVG
						</button>
					</div>
				)}
				{showZoomPanel && (
					<div
						className={`absolute top-0 right-0 bg-green px-2 py-1
								flex gap-2 justify-end items-center
								rounded-sm text-soft-gray`}>
						<div className={`flex flex-nowrap gap-1 items-center`}>
							<input
								ref={startMsRef}
								type="number"
								className={`border-b border-soft-gray field-sizing-content min-w-3 max-w-20 outline-0`}
								placeholder="0"
							/>
							<span>мс</span>
						</div>
						<span>—</span>
						<div className={`flex flex-nowrap gap-1 items-center`}>
							<input
								ref={endMsRef}
								type="number"
								className={`border-b border-soft-gray field-sizing-content min-w-3 max-w-20 outline-0`}
								placeholder={durationMs + ""}
							/>
							<div>мс</div>
						</div>
						<div className={`flex gap-1`}>
							<button
								className={`border border-soft-gray text-soft-gray rounded-sm size-5`}
								onClick={applyZoom}>
								<Check className={`size-full`} />
							</button>
							<button
								className={`border border-soft-gray text-soft-gray rounded-sm size-5`}
								onClick={rejectZoom}>
								<Ban className={`size-full p-0.5`} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
