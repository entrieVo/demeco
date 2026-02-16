import { FILE_TYPES } from "@/features/constants";

export async function UrlToImageData(image: string): Promise<ImageData> {
	return new Promise<ImageData>((resolve) => {
		const newImage = new Image();
		newImage.src = image;

		newImage.onload = () => {
			const [_, ctx] = getCanvas(newImage);
			if (!ctx) return;

			ctx.drawImage(newImage, 0, 0);
			resolve(ctx.getImageData(0, 0, newImage.width, newImage.height));
		};
	});
}

export async function fileToImageData(file: File): Promise<ImageData> {
	return new Promise<ImageData>((resolve) => {
		const image = URL.createObjectURL(file);
		const newImage = new Image();
		newImage.src = image;

		newImage.onload = () => {
			const [_, ctx] = getCanvas(newImage);
			if (!ctx) return;

			ctx.drawImage(newImage, 0, 0);
			resolve(ctx.getImageData(0, 0, newImage.width, newImage.height));
		};
	});
}

export async function imageDataToBlob(
	imageData: ImageData,
	newData: Uint8ClampedArray
): Promise<Blob> {
	const updatedImageData = new ImageData(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		newData as any,
		imageData.width,
		imageData.height
	);

	const canvas = document.createElement("canvas");
	canvas.width = updatedImageData.width;
	canvas.height = updatedImageData.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Не удалось создать 2D контекст");

	ctx.putImageData(updatedImageData, 0, 0);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Не удалось создать Blob"));
		}, "image/png");
	});
}

export function imageDataToUrl(imageData: ImageData): string {
	const [canvas, ctx] = getCanvas(imageData);
	if (!ctx) return "";

	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL(FILE_TYPES.IMAGE.FORMAT);
}

export function channelLimit(x: number): number {
	return x < 0 ? 0 : x > 255 ? 255 : x;
}

function getCanvas(
	image: HTMLImageElement | ImageData
): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
	const canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;

	return [canvas, canvas.getContext("2d")];
}
