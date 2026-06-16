export function normalDistribution(mu: number, stdDev: number) {
	let random = 0;
	for (let i = 0; i < 6; i++) {
		random += Math.random();
	}
	random = (random - 3) / Math.sqrt(0.5);

	return mu + stdDev * random;
}

export function variance(arr: Float32Array | Uint8ClampedArray): number {
	const n = arr.length;
	let sum = 0;
	for (let i = 0; i < n; i++) sum += arr[i];
	const mean = sum / n;

	let sumSq = 0;
	for (let i = 0; i < n; i++) sumSq += (arr[i] - mean) ** 2;

	return sumSq / n;
}

export function computeImageSignalPower(signal: Uint8ClampedArray): number {
	let sumSq = 0;
	let count = 0;

	for (let i = 0; i < signal.length; i += 4) {
		const y = 0.299 * signal[i] + 0.587 * signal[i + 1] + 0.114 * signal[i + 2];
		const normalized = y / 255;
		sumSq += normalized * normalized;
		count++;
	}

	return count > 0 ? sumSq / count : 1e-10;
}

export function computeAudioSignalPower(signal: Float32Array[]): number {
	let sumSq = 0;
	let count = 0;

	for (const channel of signal) {
		for (let i = 0; i < channel.length; i += 10) {
			const val = channel[i];
			if (isFinite(val)) {
				sumSq += val * val;
				count++;
			}
		}
	}

	return count > 0 ? sumSq / count : 1e-10;
}
