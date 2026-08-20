import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import db from '$lib/server/db';
import { randomBytes, scryptSync } from 'node:crypto';
import { calculateBodyMetrics, type Gender } from '$lib/bodyMetrics';
import { calculateAge, isValidBirthDate, parseDateInput } from '$lib/age';

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hashedPassword = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hashedPassword}`;
}

function parseNumber(value: FormDataEntryValue | null): number | null {
	if (!value) return null;
	const num = Number(value.toString());
	return isNaN(num) || num <= 0 ? null : num;
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString().trim();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();
		const gender = formData.get('gender')?.toString() as Gender | undefined;
		const birthDate = formData.get('birthDate')?.toString();
		const trainingType = formData.get('trainingType')?.toString();

		const weightKg = parseNumber(formData.get('weightKg'));
		const heightCm = parseNumber(formData.get('heightCm'));
		const neckCm = parseNumber(formData.get('neckCm'));
		const waistCm = parseNumber(formData.get('waistCm'));
		const hipCm = parseNumber(formData.get('hipCm'));

		// Basic validation
		if (!username || !email || !password || !confirmPassword) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (!email.includes('@') || !email.includes('.')) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters long.' });
		}

		if (gender !== 'male' && gender !== 'female') {
			return fail(400, { error: 'Please select a valid gender.' });
		}

		// Convert date input (DD/MM/YYYY or YYYY-MM-DD) to YYYY-MM-DD for storage
		const birthDateISO = birthDate ? parseDateInput(birthDate) : null;
		if (!birthDateISO || !isValidBirthDate(birthDateISO)) {
			return fail(400, { error: 'Please enter a valid birth date.' });
		}

		const age = calculateAge(birthDateISO);
		if (age < 13 || age > 120) {
			return fail(400, { error: 'You must be between 13 and 120 years old to register.' });
		}

		const validTrainingTypes = ['fitness', 'bodybuilding', 'boxing', 'kickboxing', 'kungfu', 'swimming'];
		if (!trainingType || !validTrainingTypes.includes(trainingType)) {
			return fail(400, { error: 'Please select a valid training type.' });
		}

		// Validate initial measurements
		if (weightKg === null || heightCm === null || neckCm === null || waistCm === null) {
			return fail(400, { error: 'Please enter all initial body measurements (weight, height, neck, and waist).' });
		}

		// Female users require hip measurement for body fat calculation
		if (gender === 'female' && hipCm === null) {
			return fail(400, { error: 'Hip measurement is required for female users to calculate body fat percentage.' });
		}

		// Validate measurement sanity
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
		if (gender === 'female' && hipCm !== null && (hipCm < 50 || hipCm > 220)) {
			return fail(400, { error: 'Please enter a valid hip measurement (50-220 cm).' });
		}

		// 1. Check if username is already taken
		const existingUser = db
			.prepare('SELECT id FROM users WHERE username = ?')
			.get(username);

		if (existingUser) {
			return fail(400, { error: 'Username is already taken. Please choose another.' });
		}

		// 2. Check if email is already registered
		const existingEmail = db
			.prepare('SELECT id FROM users WHERE email = ?')
			.get(email);

		if (existingEmail) {
			return fail(400, { error: 'An account with this email address already exists.' });
		}

		// 3. Hash password and create user + initial measurement
		try {
			const passwordHash = hashPassword(password);

			// Run user creation and initial measurement in a transaction
			const createUserTransaction = db.transaction(() => {
				const stmt = db.prepare(
					'INSERT INTO users (username, email, password_hash, gender, birth_date, training_type) VALUES (?, ?, ?, ?, ?, ?)'
				);
				const result = stmt.run(username, email, passwordHash, gender, birthDateISO, trainingType);
				const userId = result.lastInsertRowid as number;

				const measurementStmt = db.prepare(
					`INSERT INTO body_measurements (user_id, weight_kg, height_cm, neck_cm, waist_cm, hip_cm)
					 VALUES (?, ?, ?, ?, ?, ?)`
				);
				measurementStmt.run(userId, weightKg, heightCm, neckCm, waistCm, hipCm ?? null);

				return userId;
			});

			const userId = createUserTransaction();

			// Set session cookie on successful registration
			cookies.set('session_user_id', userId.toString(), {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7 // 1 week
			});
		} catch (err) {
			console.error('Registration error:', err);
			return fail(500, { error: 'An error occurred during registration. Please try again.' });
		}

		throw redirect(303, '/');
	}
};
