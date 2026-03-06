// ============================================
// 1. Типы и базовые операции
// ============================================

export interface Complex {
	re: number; // Вещественная часть
	im: number; // Мнимая часть
}

function complexAdd(a: Complex, b: Complex): Complex {
	return { re: a.re + b.re, im: a.im + b.im };
}

function complexSub(a: Complex, b: Complex): Complex {
	return { re: a.re - b.re, im: a.im - b.im };
}

function complexMul(a: Complex, b: Complex): Complex {
	return {
		re: a.re * b.re - a.im * b.im,
		im: a.re * b.im + a.im * b.re,
	};
}

function complexConj(a: Complex): Complex {
	return { re: a.re, im: -a.im };
}

// ============================================
// 2. Проверка степени двойки
// ============================================

function isPowerOfTwo(n: number): boolean {
	return n > 0 && (n & (n - 1)) === 0;
}

function nextPowerOfTwo(n: number): number {
	if (isPowerOfTwo(n)) return n;
	let power = 1;
	while (power < n) power *= 2;
	return power;
}

// ============================================
// 3. Битовая реверсия
// ============================================

function bitReverse(index: number, bits: number): number {
	let reversed = 0;
	for (let i = 0; i < bits; i++) {
		reversed = (reversed << 1) | (index & 1);
		index >>= 1;
	}
	return reversed;
}

function bitReversePermutation(data: Complex[]): Complex[] {
	const n = data.length;
	const bits = Math.log2(n);
	const result = new Array<Complex>(n);

	for (let i = 0; i < n; i++) {
		result[bitReverse(i, bits)] = data[i];
	}

	return result;
}

// ============================================
// 4. FFT (Алгоритм Кули-Тьюки)
// ============================================

export function fft(signal: ArrayLike<number>): Complex[] {
	const n = signal.length;

	if (!isPowerOfTwo(n)) {
		throw new Error(
			`Размер сигнала должен быть степенью двойки. Получено: ${n}`
		);
	}

	// 1. Инициализация комплексного массива
	let data: Complex[] = new Array(n);
	for (let i = 0; i < n; i++) {
		data[i] = { re: signal[i], im: 0 };
	}
	// 2. Битовая реверсия
	data = bitReversePermutation(data);

	// 3. Итеративное применение бабочек
	const levels = Math.log2(n);

	for (let level = 1; level <= levels; level++) {
		const size = 1 << level; // Размер текущей группы
		const halfSize = size >> 1; // Половина группы
		const angleStep = (-2 * Math.PI) / size;

		for (let i = 0; i < n; i += size) {
			for (let j = 0; j < halfSize; j++) {
				// Поворотный множитель (twiddle factor)
				const angle = angleStep * j;
				const w: Complex = {
					re: Math.cos(angle),
					im: Math.sin(angle),
				};

				// Индексы элементов бабочки
				const idx1 = i + j;
				const idx2 = i + j + halfSize;

				// Операция бабочки
				const t = complexMul(w, data[idx2]);
				data[idx2] = complexSub(data[idx1], t);
				data[idx1] = complexAdd(data[idx1], t);
			}
		}
	}

	return data;
}

// ============================================
// 5. IFFT (Обратное БПФ)
// ============================================

export function ifft(spectrum: Complex[]): number[] {
	const n = spectrum.length;

	if (!isPowerOfTwo(n)) {
		throw new Error(
			`Размер спектра должен быть степенью двойки. Получено: ${n}`
		);
	}

	// 1. Комплексное сопряжение входа
	const conjugated = spectrum.map(complexConj);

	// 2. Прямое БПФ
	const transformed = fftComplex(conjugated);

	// 3. Комплексное сопряжение выхода + нормировка на N
	const result = transformed.map((c) => c.re / n);

	return result;
}

// Внутренняя версия FFT для комплексных чисел (нужна для IFFT)
function fftComplex(data: Complex[]): Complex[] {
	const n = data.length;
	const levels = Math.log2(n);

	// Копия данных
	let work = data.slice();

	// Битовая реверсия
	work = bitReversePermutation(work);

	// Бабочки
	for (let level = 1; level <= levels; level++) {
		const size = 1 << level;
		const halfSize = size >> 1;
		const angleStep = (-2 * Math.PI) / size;

		for (let i = 0; i < n; i += size) {
			for (let j = 0; j < halfSize; j++) {
				const angle = angleStep * j;
				const w: Complex = {
					re: Math.cos(angle),
					im: Math.sin(angle),
				};

				const idx1 = i + j;
				const idx2 = i + j + halfSize;

				const t = complexMul(w, work[idx2]);
				work[idx2] = complexSub(work[idx1], t);
				work[idx1] = complexAdd(work[idx1], t);
			}
		}
	}

	return work;
}

// ============================================
// 6. Утилиты для работы со спектром
// ============================================

export function getAmplitude(spectrum: Complex[]): number[] {
	return spectrum.map((c) => Math.sqrt(c.re * c.re + c.im * c.im));
}

export function getPhase(spectrum: Complex[]): number[] {
	return spectrum.map((c) => Math.atan2(c.im, c.re));
}

export function complexFromAmplitudePhase(
	amplitude: number[],
	phase: number[]
): Complex[] {
	return amplitude.map((amp, i) => ({
		re: amp * Math.cos(phase[i]),
		im: amp * Math.sin(phase[i]),
	}));
}
