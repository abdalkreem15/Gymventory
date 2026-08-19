import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import db from '$lib/server/db';
import { randomBytes, scryptSync } from 'node:crypto';

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hashedPassword = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hashedPassword}`;
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString().trim();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

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

		// 3. Hash password and create user
		try {
			const passwordHash = hashPassword(password);
			const stmt = db.prepare(
				'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
			);
			const result = stmt.run(username, email, passwordHash);

			// Set session cookie on successful registration
			cookies.set('session_user_id', result.lastInsertRowid.toString(), {
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
