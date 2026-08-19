import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Redirect if someone tries to visit /logout directly via URL (GET request)
export const load: PageServerLoad = () => {
	throw redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		// Clear the session cookie
		cookies.delete('session_user_id', { path: '/' });

		// Redirect to login page
		throw redirect(303, '/login');
	}
};
