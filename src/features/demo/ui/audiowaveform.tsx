import React, {
	useMemo,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from "react";
import { twMerge } from "tailwind-merge";

export interface AudioWaveFormProps {
	data: Float32Array;
	sampleRate?: number;
	startTimeMs?: number;
	endTimeMs?: number;
	durationMs?: number;
	height?: number;
	width?: number;
	color?: string;
	backgroundColor?: string;
	showGrid?: boolean;
	title?: string;
	controlPanel?: React.ReactNode;
	className?: string;
}

export interface AudioWaveformRef {
	exportToPNG: () => void;
	exportToSVG: () => void;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveFormProps>(
	function AudioWaveform(props, ref) {
		const {
			data,
			sampleRate = 16000,
			startTimeMs = 0,
			endTimeMs,
			durationMs,
			height = 300,
			width = 900,
			color = "#c24e4b",
			backgroundColor = "background",
			showGrid = true,
			title,
			controlPanel,
			className,
		} = props;

		// Определяем диапазон отсчётов
		const { startSample, endSample } = useMemo(() => {
			const totalSamples = data.length;
			const totalDurationMs = (totalSamples / sampleRate) * 1000;

			let startMs = startTimeMs;
			let endMs: number;

			if (endTimeMs !== undefined) {
				endMs = endTimeMs;
			} else if (durationMs !== undefined) {
				endMs = startMs + durationMs;
			} else {
				startMs = 0;
				endMs = 10;
			}

			startMs = Math.max(0, Math.min(startMs, totalDurationMs));
			endMs = Math.max(0, Math.min(endMs, totalDurationMs));

			const startSample = Math.floor((startMs / 1000) * sampleRate);
			const endSample = Math.floor((endMs / 1000) * sampleRate);

			return {
				startSample: Math.min(startSample, totalSamples),
				endSample: Math.min(endSample, totalSamples),
			};
		}, [data.length, sampleRate, startTimeMs, endTimeMs, durationMs]);

		// === Генерация SVG-пути для сигнала ===
		const generateWaveformPath = (
			signalData: Float32Array,
			startIdx: number,
			endIdx: number,
			plotWidth: number,
			plotHeight: number,
			centerY: number,
			scaleFactor: number,
			offsetX: number = 60,
		): string => {
			const visibleSamples = endIdx - startIdx;
			if (visibleSamples === 0) return "";

			let path = "";
			let prevYMax: number | null = null;
			let prevX: number | null = null;

			const numPoints = Math.min(plotWidth, Math.max(visibleSamples, 1));

			for (let px = 0; px < numPoints; px++) {
				const sampleIndex =
					startIdx + Math.floor((px / numPoints) * visibleSamples);
				const nextSampleIndex =
					startIdx + Math.floor(((px + 1) / numPoints) * visibleSamples);

				const start = Math.max(sampleIndex, startIdx);
				const end = Math.min(nextSampleIndex, endIdx);

				let minVal = Infinity;
				let maxVal = -Infinity;

				for (let i = start; i < end; i++) {
					const val = signalData[i];
					if (val < minVal) minVal = val;
					if (val > maxVal) maxVal = val;
				}

				if (start === end && start < endIdx) {
					const val = signalData[start];
					minVal = val;
					maxVal = val;
				}

				const x = offsetX + (px / numPoints) * plotWidth;
				const yMin = centerY - maxVal * scaleFactor;
				const yMax = centerY - minVal * scaleFactor;

				if (px === 0) {
					path += `M ${x} ${yMin} L ${x} ${yMax}`;
				} else {
					path += ` M ${prevX} ${prevYMax} L ${x} ${yMin}`;
					path += ` L ${x} ${yMax}`;
				}

				prevYMax = yMax;
				prevX = x;
			}

			return path;
		};

		// === Генерация полного SVG-содержимого ===
		const svgContent = useMemo(() => {
			const plotWidth = width - 80;
			const plotHeight = height - 70;
			const centerY = 35 + plotHeight / 2;
			const amplitude = plotHeight * 0.4;

			const visibleSamples = endSample - startSample;
			const duration = (visibleSamples / sampleRate) * 1000;

			const timeTicks = [];
			for (let i = 0; i <= 10; i++) {
				const time = startTimeMs + (duration * i) / 10;
				const x = 60 + (plotWidth * i) / 10;
				timeTicks.push({
					x,
					label:
						time >= 1000
							? `${(time / 1000).toFixed(1)} s`
							: `${time.toFixed(0)} ms`,
				});
			}
			const ampTicks = [];
			for (let i = -2.5; i <= 2.5; i++) {
				const value = (i * 2) / 5;
				const y = centerY - value * amplitude;
				ampTicks.push({ y, label: value.toFixed(1) });
			}

			const waveformPath = generateWaveformPath(
				data,
				startSample,
				endSample,
				plotWidth,
				plotHeight,
				centerY,
				amplitude,
			);

			return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: system-ui, -apple-system, sans-serif">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  
  ${
		showGrid
			? `
  <g stroke="#e5e7eb" stroke-width="0.5">
    ${ampTicks
			.map(
				(tick) =>
					`<line x1="60" y1="${tick.y}" x2="${width - 20}" y2="${tick.y}"/>`,
			)
			.join("")}
    ${timeTicks.map((tick) => `<line x1="${tick.x}" y1="35" x2="${tick.x}" y2="${height - 40}"/>`).join("")}
  </g>`
			: ""
	}
  
  ${`
  <line x1="60" y1="${centerY}" x2="${width - 20}" y2="${centerY}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="5,5"/>
  <path d="${waveformPath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  `}
  
  <line x1="60" y1="35" x2="60" y2="${height - 40}" stroke="#374151" stroke-width="1.5"/>
  <line x1="60" y1="${height - 40}" x2="${width - 20}" y2="${height - 40}" stroke="#374151" stroke-width="1.5"/>
  
  ${ampTicks
		.map(
			(tick) => `
    <g>
      <line x1="55" y1="${tick.y}" x2="60" y2="${tick.y}" stroke="#374151" stroke-width="1"/>
      <text x="50" y="${tick.y + 4}" text-anchor="end" font-size="10" fill="#6b7280">${tick.label}</text>
    </g>
  `,
		)
		.join("")}
  
  ${timeTicks
		.map(
			(tick) => `
    <g>
      <line x1="${tick.x}" y1="${height - 40}" x2="${tick.x}" y2="${height - 35}" stroke="#374151" stroke-width="1"/>
      <text x="${tick.x}" y="${height - 20}" text-anchor="middle" font-size="10" fill="#6b7280">${tick.label}</text>
    </g>
  `,
		)
		.join("")}
  
  <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#374151" font-weight="500">Время</text>
  <text x="15" y="${height / 2}" text-anchor="middle" font-size="11" fill="#374151" font-weight="500" transform="rotate(-90, 15, ${height / 2})">Амплитуда</text>
  
  ${title ? `<text x="${width / 2}" y="20" text-anchor="middle" font-size="14" fill="#1f2937" font-weight="600">${title}</text>` : ""}
</svg>`;
		}, [
			data,
			startSample,
			endSample,
			width,
			height,
			color,
			backgroundColor,
			showGrid,
			title,
			sampleRate,
		]);

		const [blobUrl, setBlobUrl] = React.useState("");

		useEffect(() => {
			const blob = new Blob([svgContent], {
				type: "image/svg+xml;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);

			if (blobUrl) URL.revokeObjectURL(blobUrl);

			setBlobUrl(url);

			return () => {
				URL.revokeObjectURL(url);
			};
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [svgContent]);

		// Экспорт в SVG
		const exportToSVG = () => {
			const blob = new Blob([svgContent], {
				type: "image/svg+xml;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.download = title ? `${title}.svg` : "audio-visualization.svg";
			link.href = url;
			link.click();
			URL.revokeObjectURL(url);
		};

		// Экспорт в PNG (высокое разрешение)
		const exportToPNG = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			canvas.width = width * 2;
			canvas.height = height * 2;

			img.onload = () => {
				if (ctx) {
					ctx.scale(2, 2);
					ctx.fillStyle = backgroundColor;
					ctx.fillRect(0, 0, width, height);
					ctx.drawImage(img, 0, 0);
					const pngData = canvas.toDataURL("image/png");
					const link = document.createElement("a");
					link.download = title ? `${title}.png` : "audio-visualization.png";
					link.href = pngData;
					link.click();
				}
			};

			img.src =
				"data:image/svg+xml;base64," +
				btoa(unescape(encodeURIComponent(svgContent)));
		};

		useImperativeHandle(
			ref,
			() => ({
				exportToPNG,
				exportToSVG,
			}),
			[exportToPNG, exportToSVG],
		);

		if (!blobUrl) return;

		return (
			<div className={className}>
				{title && (
					<h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
				)}

				<div className={`relative w-fit`}>
					<img
						src={blobUrl}
						alt={title || "Audio visualization"}
						width={width}
						height={height}
						className="border border-gray-200 rounded bg-white max-w-full h-auto object-contain"
						style={{ display: "block" }}
					/>

					{controlPanel}
				</div>
			</div>
		);
	},
);
