import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';
import { calculateBodyMetrics, calculatePerfectWeight, type Gender } from '$lib/bodyMetrics';
import { calculateAge, isValidBirthDate, parseDateInput } from '$lib/age';

export interface MeasurementRow {
	id: number;
	weight_kg: number;
	height_cm: number;
	neck_cm: number;
	waist_cm: number;
	hip_cm: number | null;
	measured_at: string;
}

export interface MeasurementWithMetrics extends MeasurementRow {
	bmi: number;
	body_fat_percent: number | null;
	bmi_category: string;
}

export interface TrainingTypeInfo {
	name: string;
	description: string;
}

export interface PerfectWeightInfo {
	suggestedKg: number;
	minKg: number;
	maxKg: number;
	customKg: number | null;
}

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = db
		.prepare(
			'SELECT id, username, email, gender, birth_date, training_type, target_weight_kg FROM users WHERE id = ?'
		)
		.get(locals.user.id) as {
		id: number;
		username: string;
		email: string;
		gender: Gender;
		birth_date: string;
		training_type: string;
		target_weight_kg: number | null;
	};

	// Compute age dynamically from birth date
	const userWithAge = {
		...user,
		age: calculateAge(user.birth_date)
	};

	const measurementRows = db
		.prepare(
			`SELECT id, weight_kg, height_cm, neck_cm, waist_cm, hip_cm, measured_at
			 FROM body_measurements
			 WHERE user_id = ?
			 ORDER BY measured_at DESC`
		)
		.all(user.id) as MeasurementRow[];

	const trainingType = db
		.prepare('SELECT name, description FROM training_types WHERE name = ?')
		.get(user.training_type) as TrainingTypeInfo | undefined;

	// Calculate perfect weight for fitness users based on latest measurement height
	let perfectWeight: PerfectWeightInfo | null = null;
	if (user.training_type === 'fitness' && measurementRows.length > 0) {
		const latestHeight = measurementRows[0].height_cm;
		const range = calculatePerfectWeight(latestHeight, userWithAge.age);
		perfectWeight = {
			suggestedKg: range.suggestedKg,
			minKg: range.minKg,
			maxKg: range.maxKg,
			customKg: user.target_weight_kg
		};
	}

	// Calculate metrics for each measurement
	const measurements: MeasurementWithMetrics[] = measurementRows.map((row) => {
		const metrics = calculateBodyMetrics({
			gender: user.gender,
			age: userWithAge.age,
			weightKg: row.weight_kg,
			heightCm: row.height_cm,
			neckCm: row.neck_cm,
			waistCm: row.waist_cm,
			hipCm: row.hip_cm
		});

		return {
			...row,
			bmi: metrics.bmi,
			body_fat_percent: metrics.bodyFatPercent,
			bmi_category: metrics.bmiCategory
		};
	});

	return {
		user: userWithAge,
		trainingType,
		measurements,
		perfectWeight
	};
};

function parseNumber(value: FormDataEntryValue | null): number | null {
	if (!value) return null;
	const num = Number(value.toString());
	return isNaN(num) || num <= 0 ? null : num;
}

export const actions: Actions = {
	deleteAccount: async ({ cookies, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			// Deleting the user cascades to their body_measurements and user_inventory rows
			// (both have ON DELETE CASCADE foreign keys)
			db.prepare('DELETE FROM users WHERE id = ?').run(locals.user.id);
		} catch (err) {
			console.error('Failed to delete account:', err);
			return fail(500, { error: 'Failed to delete your account. Please try again.' });
		}

		// Clear the session cookie
		cookies.delete('session_user_id', { path: '/' });

		throw redirect(303, '/login');
	},

	updateBirthDate: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const birthDate = formData.get('birthDate')?.toString();

		// Convert date input (DD/MM/YYYY or YYYY-MM-DD) to YYYY-MM-DD for storage
		const birthDateISO = birthDate ? parseDateInput(birthDate) : null;
		if (!birthDateISO || !isValidBirthDate(birthDateISO)) {
			return fail(400, { error: 'Please enter a valid birth date.' });
		}

		const age = calculateAge(birthDateISO);
		if (age < 13 || age > 120) {
			return fail(400, { error: 'You must be between 13 and 120 years old.' });
		}

		try {
			db.prepare('UPDATE users SET birth_date = ? WHERE id = ?').run(birthDateISO, locals.user.id);
		} catch (err) {
			console.error('Failed to update birth date:', err);
			return fail(500, { error: 'Failed to save your birth date. Please try again.' });
		}

		return { success: true, message: 'Your birth date has been updated.' };
	},

	updateTargetWeight: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const targetWeightRaw = formData.get('targetWeight')?.toString();

		// Empty value means "use suggested weight" (clear custom target)
		if (!targetWeightRaw || targetWeightRaw.trim() === '') {
			try {
				db.prepare('UPDATE users SET target_weight_kg = NULL WHERE id = ?').run(locals.user.id);
			} catch (err) {
				console.error('Failed to clear target weight:', err);
				return fail(500, { error: 'Failed to save your target weight. Please try again.' });
			}
			return { success: true, message: 'Using your suggested perfect weight.' };
		}

		const targetWeight = Number(targetWeightRaw);
		if (isNaN(targetWeight) || targetWeight < 25 || targetWeight > 350) {
			return fail(400, { error: 'Please enter a valid target weight (25-350 kg).' });
		}

		try {
			db.prepare('UPDATE users SET target_weight_kg = ? WHERE id = ?').run(
				targetWeight,
				locals.user.id
			);
		} catch (err) {
			console.error('Failed to update target weight:', err);
			return fail(500, { error: 'Failed to save your target weight. Please try again.' });
		}

		return { success: true, message: 'Your perfect weight target has been updated.' };
	},

	updateGoal: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const trainingType = formData.get('trainingType')?.toString();

		const validTrainingTypes = ['fitness', 'bodybuilding', 'boxing', 'kickboxing', 'kungfu', 'swimming'];
		if (!trainingType || !validTrainingTypes.includes(trainingType)) {
			return fail(400, { error: 'Please select a valid training goal.' });
		}

		try {
			db.prepare('UPDATE users SET training_type = ? WHERE id = ?').run(
				trainingType,
				locals.user.id
			);
		} catch (err) {
			console.error('Failed to update training goal:', err);
			return fail(500, { error: 'Failed to save your training goal. Please try again.' });
		}

		return { success: true, message: 'Your training goal has been updated.' };
	},

	addMeasurement: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const weightKg = parseNumber(formData.get('weightKg'));
		const heightCm = parseNumber(formData.get('heightCm'));
		const neckCm = parseNumber(formData.get('neckCm'));
		const waistCm = parseNumber(formData.get('waistCm'));
		const hipCm = parseNumber(formData.get('hipCm'));

		// Fetch user gender
		const user = db
			.prepare('SELECT gender FROM users WHERE id = ?')
			.get(locals.user.id) as { gender: Gender } | undefined;

		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Validation
		if (weightKg === null || heightCm === null || neckCm === null || waistCm === null) {
			return fail(400, { error: 'Please enter all required measurements (weight, height, neck, and waist).' });
		}

		if (user.gender === 'female' && hipCm === null) {
			return fail(400, { error: 'Hip measurement is required for female users to calculate body fat percentage.' });
		}

		if (weightKg < 25 || weightKg > 350) {
			return fail(400, { error: 'Please enter a valid weight (25-350 kg).' });
		}
		if (heightCm < 100 || heightCm > 250) {
			return fail(400, { error: 'Please enter a valid height (100-250 cm).' });
		}
		if (neckCm < 20 || neckCm > 60) {
			return fail(400, { error: 'Please enter a valid neck measurement (20-60 cm).' });
		}
		if (waistCm < 40 || waistCm > 200) {
			return fail(400, { error: 'Please enter a valid waist measurement (40-200 cm).' });
		}
		if (user.gender === 'female' && hipCm !== null && (hipCm < 50 || hipCm > 220)) {
			return fail(400, { error: 'Please enter a valid hip measurement (50-220 cm).' });
		}

		try {
			const stmt = db.prepare(
				`INSERT INTO body_measurements (user_id, weight_kg, height_cm, neck_cm, waist_cm, hip_cm)
				 VALUES (?, ?, ?, ?, ?, ?)`
			);
			stmt.run(locals.user.id, weightKg, heightCm, neckCm, waistCm, hipCm ?? null);
		} catch (err) {
			console.error('Failed to add measurement:', err);
			return fail(500, { error: 'Failed to save your measurement. Please try again.' });
		}

		return { success: true };
	}
};
