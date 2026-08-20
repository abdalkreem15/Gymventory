// mostly done by me but has some ai modificaition to comments because mine were inconclusive
export type Gender = 'male' | 'female';

export interface BodyMetricsInput {
    gender: Gender;
    age?: number | null;
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

/** Utility to round a number to a fixed decimal precision cleanly */
export function roundTo(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Convert centimeters to inches */
export function cmToInches(cm: number): number {
    return cm / 2.54;
}

/**
 * Get BMI category label.
 * For adults under 65, uses the standard WHO classification.
 * For adults 65+, uses age-adjusted thresholds (22-27 normal range)
 * since slightly higher BMI is associated with better health outcomes in older adults.
 */
export function getBmiCategory(bmi: number, age?: number | null): string {
    // Age-adjusted BMI for older adults (65+)
    if (age !== undefined && age !== null && age >= 65) {
        if (bmi < 22) return 'Underweight';
        if (bmi < 27) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    // Standard WHO classification
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25.0) return 'Normal';
    if (bmi < 30.0) return 'Overweight';
    return 'Obese';
}

export interface PerfectWeightResult {
	minKg: number;
	maxKg: number;
	suggestedKg: number;
}

/**
 * Calculate the "perfect weight" range for a given height.
 * Uses the same age-adjusted BMI thresholds as getBmiCategory:
 * - Under 65: healthy BMI range 18.5–24.9, suggested midpoint at BMI 22
 * - 65+: healthy BMI range 22–27, suggested midpoint at BMI 24.5
 */
export function calculatePerfectWeight(heightCm: number, age?: number | null): PerfectWeightResult {
	const heightMeters = heightCm / 100;
	const heightSquared = heightMeters * heightMeters;

	let minBmi: number;
	let maxBmi: number;
	let suggestedBmi: number;

	if (age !== undefined && age !== null && age >= 65) {
		minBmi = 22;
		maxBmi = 27;
		suggestedBmi = 24.5;
	} else {
		minBmi = 18.5;
		maxBmi = 24.9;
		suggestedBmi = 22;
	}

	return {
		minKg: roundTo(minBmi * heightSquared, 1),
		maxKg: roundTo(maxBmi * heightSquared, 1),
		suggestedKg: roundTo(suggestedBmi * heightSquared, 1)
	};
}

/** Get body fat category label (ACE / U.S. Navy standard) */
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
 */
export function calculateBodyMetrics(input: BodyMetricsInput): BodyMetricsResult {
    const { gender, age, weightKg, heightCm, neckCm, waistCm, hipCm } = input;

    // Validate essential physical inputs
    if (heightCm <= 0 || weightKg <= 0 || neckCm <= 0 || waistCm <= 0) {
        return {
            bmi: 0,
            bodyFatPercent: null,
            bmiCategory: 'Invalid Input',
            bodyFatCategory: null
        };
    }

    // 1. Precise BMI Calculation
    const heightMeters = heightCm / 100;
    const rawBmi = weightKg / (heightMeters * heightMeters);
    const bmi = roundTo(rawBmi, 1);

    // 2. Imperial Conversions for Navy Formula
    const heightIn = cmToInches(heightCm);
    const neckIn = cmToInches(neckCm);
    const waistIn = cmToInches(waistCm);

    let rawBodyFatPercent: number | null = null;

    if (gender === 'male') {
        const delta = waistIn - neckIn;
        // Ensure logarithm operand is strictly positive
        if (delta > 0) {
            const density =
                1.0324 -
                0.19077 * Math.log10(delta) +
                0.15456 * Math.log10(heightIn);
            
            rawBodyFatPercent = 495 / density - 450;
        }
    } else {
        if (hipCm && hipCm > 0) {
            const hipIn = cmToInches(hipCm);
            const delta = waistIn + hipIn - neckIn;
            
            // Ensure female circumference sum is strictly greater than neck circumference
            if (delta > 0) {
                const density =
                    1.29579 -
                    0.35004 * Math.log10(delta) +
                    0.221 * Math.log10(heightIn);
                
                rawBodyFatPercent = 495 / density - 450;
            }
        }
    }

    // 3. Rounding and Physiological Bounds Clamping (2% to 65%)
    let bodyFatPercent: number | null = null;
    if (rawBodyFatPercent !== null && !isNaN(rawBodyFatPercent)) {
        const clampedFat = Math.min(Math.max(rawBodyFatPercent, 2.0), 65.0);
        bodyFatPercent = roundTo(clampedFat, 1);
    }

    const bmiCategory = getBmiCategory(bmi, age);
    const bodyFatCategory = bodyFatPercent !== null ? getBodyFatCategory(bodyFatPercent, gender) : null;

    return {
        bmi,
        bodyFatPercent,
        bmiCategory,
        bodyFatCategory
    };
}
