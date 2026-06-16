import { Complex } from "./fft";

export function createSpectrum(
	amplitude: Float32Array,
	phase: Float32Array
): Complex[] {
	return amplitude.reduce<Complex[]>((acc, amp, j) => {
		acc.push({
			re: amp * Math.cos(phase[j]),
			im: amp * Math.sin(phase[j]),
		});
		return acc;
	}, []);
}

export function binProps(spectrum: Complex[]): {
	amplitude: Float32Array;
	phase: Float32Array;
} {
	const N = spectrum.length;
	const amplitude = new Float32Array(N),
		phase = new Float32Array(N);

	spectrum.forEach((s, i) => {
		const { re, im } = s;
		amplitude[i] = Math.sqrt(re * re + im * im);
		phase[i] = Math.atan2(im, re);
	});

	return { amplitude: amplitude, phase: phase };
}

export function hannWindow(i: number, N: number): number {
	return 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
}
