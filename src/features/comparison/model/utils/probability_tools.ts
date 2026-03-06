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
