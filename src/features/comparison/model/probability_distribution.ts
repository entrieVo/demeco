export function normalDistribution(mu: number, stdDev: number) {
	let random = 0;
	for (let i = 0; i < 6; i++) {
		random += Math.random();
	}
	random = (random - 3) / Math.sqrt(0.5);

	return mu + stdDev * random;
}
