import { useEffect, useState } from "react";
import { AudiobufferData, FileType } from "../utils/types";
import { channelsToBlob } from "../utils/audio-processing";
import { imageDataToBlob } from "../utils/image-processing";

interface usePreviewDataReturns {
	blob: Blob;
}

export function usePreviewData(
	type: FileType,
	ref: AudiobufferData | ImageData | null,
): usePreviewDataReturns {
	const [blob, setBlob] = useState<Blob>(new Blob());

	useEffect(() => {
		const convertToBlob = async () => {
			let newBlob = new Blob();

			if (ref && type === "audio") {
				newBlob = await audioToBlob(ref as AudiobufferData);
			} else if (ref && type === "image") {
				newBlob = await imageToBlob(ref as ImageData);
			}

			setBlob(newBlob);
		};
		convertToBlob();
	}, [ref]);

	return { blob };
}

async function audioToBlob(buffer: AudiobufferData): Promise<Blob> {
	const { data, sampleRate } = buffer;
	const blob = await channelsToBlob(data, sampleRate);
	return blob;
}

async function imageToBlob(imageData: ImageData): Promise<Blob> {
	const { data, width, height } = imageData;
	const blob = await imageDataToBlob(data, width, height);
	return blob;
}
