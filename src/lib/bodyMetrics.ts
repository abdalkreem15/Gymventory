export type Gender = 'male' | 'female';

export interface BodyMetricsInput {
	gender: Gender;
	weightKg: number;
	heightCm: number;
	neckCm: number;
	waistCm: number;
	hipCm?: number | null;
}

export interface BodyMetricsResult {
	bmi: number;
	bodyFatPercent: number | null;
	bmiCategory: string;
	bodyFatCategory: string | null;
}

/** Convert centimeters to inches */
export function cmToInches(cm: number): number {
	return cm / 2.54;
}

/** Get BMI category label */
export function getBmiCategory(bmi: number): string {
	if (bmi < 18.5) return 'Underweight';
	if (bmi < 25) return 'Normal';
	if (bmi < 30) return 'Overweight';
	return 'Obese';
}

/** Get body fat category label (Navy method classification) */
export function getBodyFatCategory(bodyFatPercent: number, gender: Gender): string {
	if (gender === 'male') {
		if (bodyFatPercent < 6) return 'Essential Fat';
		if (bodyFatPercent < 14) return 'Athletic';
		if (bodyFatPercent < 18) return 'Fit';
		if (bodyFatPercent < 25) return 'Average';
		return 'Above Average';
	} else {
		if (bodyFatPercent < 14) return 'Essential Fat';
		if (bodyFatPercent < 21) return 'Athletic';
		if (bodyFatPercent < 25) return 'Fit';
		if (bodyFatPercent < 32) return 'Average';
		return 'Above Average';
	}
}

/**
 * Calculate BMI and body fat percentage using the U.S. Navy body fat formula.
 *
 * BMI is universal: weight(kg) / height(m)^2
 *
 * Body Fat % (Navy method) differs by gender:
 *   Male:   495 / (1.0324 - 0.19077·log10(waist - neck) + 0.15456·log10(height)) - 450
 *   Female: 495 / (1.29579 - 0.35004·log10(waist + hip - neck) + 0.22100·log10(height)) - 450
 * (all measurements in inches)
 */
export function calculateBodyMetrics(input: BodyMetricsInput): BodyMetricsResult {
	const { gender, weightKg, heightCm, neckCm, waistCm, hipCm } = input;

	// BMI
	const heightMeters = heightCm / 100;
	const bmi = weightKg / (heightMeters * heightMeters);

	const heightIn = cmToInches(heightCm);
	const neckIn = cmToInches(neckCm);
	const waistIn = cmToInches(waistCm);

	let bodyFatPercent: number | null = null;

	if (gender === 'male') {
		// Men need waist and neck only
		if (waistIn > neckIn && heightIn > 0) {
			const base =
				1.0324 -
				0.19077 * Math.log10(waistIn - neckIn) +
				0.15456 * Math.log10(heightIn);
			bodyFatPercent = 495 / base - 450;
		}
	} else {
		// Women also need the hip measurement
		if (hipCm && hipCm > 0 && waistIn > neckIn) {
			const hipIn = cmToInches(hipCm);
			const base =
				1.29579 -
				0.35004 * Math.log10(waistIn + hipIn - neckIn) +
				0.221 * Math.log10(heightIn);
			bodyFatPercent = 495 / base - 450;
		}
	}

	const bmiCategory = getBmiCategory(bmi);
	const bodyFatCategory = bodyFatPercent !== null ? getBodyFatCategory(bodyFatPercent, gender) : null;

	return {
		bmi,
		bodyFatPercent,
		bmiCategory,
		bodyFatCategory
	};
}