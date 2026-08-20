import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = ({ locals }) => {
	// hooks.server.ts ensures user is defined, but double check for TS safety
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const equipment = db.prepare('SELECT * FROM equipment ORDER BY name ASC').all();

	const userEquipment = db
		.prepare('SELECT equipment_id FROM user_inventory WHERE user_id = ?')
		.all(locals.user.id) as { equipment_id: number }[];

	// Fetch equipment recommended for this user's training type
	const recommendedEquipment = db
		.prepare(
			`
		SELECT DISTINCT eq.id, eq.name
		FROM equipment eq
		JOIN exercise_equipment ee ON eq.id = ee.equipment_id
		JOIN training_exercises te ON ee.exercise_id = te.exercise_id
		WHERE te.training_type_id = (SELECT id FROM training_types WHERE name = ?)
		ORDER BY eq.name ASC
	`
		)
		.all(locals.user.training_type) as { id: number; name: string }[];

	return {
		user: locals.user,
		equipment,
		userEquipmentIds: userEquipment.map((item) => item.equipment_id),
		recommendedEquipment
	};
};

export const actions: Actions = {
	saveInventory: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const selectedEquipmentIds = formData.getAll('equipment').map((id) => Number(id));

		const deleteStmt = db.prepare('DELETE FROM user_inventory WHERE user_id = ?');
		const insertStmt = db.prepare(
			'INSERT INTO user_inventory (user_id, equipment_id) VALUES (?, ?)'
		);

		// Wrap delete and re-insert in a single database transaction
		const saveTransaction = db.transaction((userId: number, equipmentIds: number[]) => {
			deleteStmt.run(userId);
			for (const equipmentId of equipmentIds) {
				insertStmt.run(userId, equipmentId);
			}
		});

		saveTransaction(locals.user.id, selectedEquipmentIds);

		return { success: true };
	}
};
