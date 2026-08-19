import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export interface RecommendedExercise {
	id: number;
	name: string;
	target_muscle: string;
	instructions: string | null;
	required_equipment: string;
}

export const load: PageServerLoad = () => {
	// Query exercises where ALL required equipment is in user_inventory
	const recommendedExercises = db
		.prepare(
			`
		SELECT 
			e.id,
			e.name,
			e.target_muscle,
			e.instructions,
			GROUP_CONCAT(eq.name, ', ') AS required_equipment
		FROM exercises e
		JOIN exercise_equipment ee ON e.id = ee.exercise_id
		JOIN equipment eq ON ee.equipment_id = eq.id
		WHERE e.id NOT IN (
			-- Exclude exercises that require equipment NOT in user_inventory
			SELECT exercise_id 
			FROM exercise_equipment 
			WHERE equipment_id NOT IN (SELECT equipment_id FROM user_inventory)
		)
		GROUP BY e.id
		ORDER BY e.target_muscle ASC, e.name ASC
	`
		)
		.all() as RecommendedExercise[];

	// Fetch current user equipment count to handle empty states gracefully
	const userInventoryCount = db
		.prepare('SELECT COUNT(*) as count FROM user_inventory')
		.get() as { count: number };

	return {
		exercises: recommendedExercises,
		hasInventory: userInventoryCount.count > 0
	};
};
