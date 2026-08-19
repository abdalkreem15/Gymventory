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

/** Utility to round a number to a fixed decimal precision cleanly */
export function roundTo(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Convert centimeters to inches */
export function cmToInches(cm: number): number {
    return cm / 2.54;
}

/** Get BMI category label (WHO classification) */
export function getBmiCategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25.0) return 'Normal';
    if (bmi < 30.0) return 'Overweight';
    return 'Obese';
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
    const { gender, weightKg, heightCm, neckCm, waistCm, hipCm } = input;

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

    const bmiCategory = getBmiCategory(bmi);
    const bodyFatCategory = bodyFatPercent !== null ? getBodyFatCategory(bodyFatPercent, gender) : null;

    return {
        bmi,
        bodyFatPercent,
        bmiCategory,
        bodyFatCategory
    };
}
