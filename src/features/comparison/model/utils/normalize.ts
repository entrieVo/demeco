export function computeAudioVariance(relativeLevel: number): number {
	return relativeLevel ** 3 * 1.0;
}

export function computeImageVariance(relativeLevel: number): number {
	return relativeLevel * 255;
}
