import React, { useEffect, useRef, useMemo, useState } from "react";

interface BrightnessHistogramProps {
	data: Uint8ClampedArray;
	imageWidth: number;
	imageHeight: number;
	color?: string;
	backgroundColor?: string;
	showGrid?: boolean;
	className?: string;
}

export function BrightnessHistogram({
	data,
	imageWidth,
	imageHeight,
	color = "blue",
	backgroundColor = "background",
	showGrid = true,
	className = "",
}: BrightnessHistogramProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				if (width > 0 && height > 0) {
					setDimensions({ width, height });
				}
			}
		});

		observer.observe(canvas);

		return () => observer.disconnect();
	}, []);

	const histogram = useMemo(() => {
		const bins = new Array(256).fill(0);
		const totalPixels = imageWidth * imageHeight;

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
			bins[brightness]++;
		}

		return { bins, totalPixels };
	}, [data, imageWidth, imageHeight]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;

		canvas.width = dimensions.width * dpr;
		canvas.height = dimensions.height * dpr;

		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, dimensions.width, dimensions.height);

		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, dimensions.width, dimensions.height);

		if (showGrid) {
			ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
			ctx.lineWidth = 0.5;
			for (let i = 0; i <= 4; i++) {
				const y = (dimensions.height / 4) * i;
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(dimensions.width, y);
				ctx.stroke();
			}
		}

		const maxCount = Math.max(...histogram.bins);
		if (maxCount === 0) return;

		ctx.fillStyle = color;
		const barWidth = dimensions.width / 256;

		for (let i = 0; i < 256; i++) {
			const count = histogram.bins[i];
			if (count === 0) continue;

			const barHeight = (count / maxCount) * (dimensions.height - 20);
			const x = i * barWidth;
			const y = dimensions.height - 20 - barHeight;
			ctx.fillRect(x, y, barWidth + 0.5, barHeight);
		}

		ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
		ctx.font = "11px sans-serif";
		ctx.fillText("0", 4, dimensions.height - 5);
		ctx.fillText("255", dimensions.width - 24, dimensions.height - 5);
	}, [histogram, dimensions, color, backgroundColor, showGrid]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{
				width: "100%",
				height: "100%",
				display: "block",
				borderRadius: "4px",
			}}
			title={`Всего пикселей: ${histogram.totalPixels.toLocaleString()}`}
		/>
	);
}
