export function computeAudioNoiseVariance(snr: number): number {
	return snr ** 3 * 1.0;
}

export function computeImageNoiseVariance(snr: number): number {
	return snr * 255;
}

export function computeDenoiseVariance(
	relativeLevel: number,
	signalPower: number
): number {
	return signalPower * Math.pow(10, relativeLevel / 10);
}
