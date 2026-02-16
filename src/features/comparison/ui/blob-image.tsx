// src/features/analisys/ui/blob-image.tsx
"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { cn } from "@/shared/lib/css";

export function BlobImage({
	blob,
	className,
}: {
	blob: Blob | null;
	className?: string;
}) {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (url) {
			URL.revokeObjectURL(url);
		}

		if (blob) {
			const newUrl = URL.createObjectURL(blob);
			setUrl(newUrl);
		} else {
			setUrl(null);
		}

		return () => {
			if (url) {
				URL.revokeObjectURL(url);
			}
		};
	}, [blob]);

	if (!url) return null;

	return (
		<div className={className}>
			<img src={url} alt="image" className="pixelated size-full object-cover" />
		</div>
	);
}
