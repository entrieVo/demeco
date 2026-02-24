// "use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { cn } from "@/shared/lib/css";
import { useState, useEffect } from "react";

export function BlobAudio({
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
		<div
			className={cn("size-full flex justify-center items-center", className)}>
			<audio src={url} controls />
		</div>
	);
}
