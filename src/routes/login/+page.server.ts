import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import db from '$lib/server/db';
import { scryptSync, timingSafeEqual } from 'node:crypto';

function verifyPassword(password: string, storedHash: string): boolean {
	const [salt, key] = storedHash.split(':');
	if (!salt || !key) return false;

	const hashedBuffer = scryptSync(password, salt, 64);
	const keyBuffer = Buffer.from(key, 'hex');

	if (hashedBuffer.length !== keyBuffer.length) return false;
	return timingSafeEqual(hashedBuffer, keyBuffer);
}

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString().trim();
		const password = formData.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required.' });
		}

		// Fetch user from database
		const user = db
			.prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
			.get(username) as { id: number; username: string; password_hash: string } | undefined;

		if (!user || !verifyPassword(password, user.password_hash)) {
			return fail(400, { error: 'Invalid username or password.' });
		}

		// Set session cookie
		cookies.set('session_user_id', user.id.toString(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(303, '/');
	}
};
