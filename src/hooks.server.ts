import { redirect, type Handle } from '@sveltejs/kit';
import db from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const userId = event.cookies.get('session_user_id');

	if (userId) {
		const user = db
			.prepare(
				'SELECT id, username, email, gender, training_type FROM users WHERE id = ?'
			)
			.get(userId) as
			| {
					id: number;
					username: string;
					email: string;
					gender: string;
					training_type: string;
			  }
			| undefined;

		if (user) {
			event.locals.user = user;
		} else {
			event.cookies.delete('session_user_id', { path: '/' });
		}
	}

	// Protect root and authenticated routes
	const isAuthRoute = event.url.pathname === '/login' || event.url.pathname === '/register';

	if (!event.locals.user && !isAuthRoute) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && isAuthRoute) {
		throw redirect(303, '/');
	}

	return resolve(event);
};