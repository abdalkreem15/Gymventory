import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';
import { calculateBodyMetrics, type Gender } from '$lib/bodyMetrics';

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

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = db
		.prepare('SELECT id, username, email, gender, training_type FROM users WHERE id = ?')
		.get(locals.user.id) as {
		id: number;
		username: string;
		email: string;
		gender: Gender;
		training_type: string;
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

	// Calculate metrics for each measurement
	const measurements: MeasurementWithMetrics[] = measurementRows.map((row) => {
		const metrics = calculateBodyMetrics({
			gender: user.gender,
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
		user,
		trainingType,
		measurements
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