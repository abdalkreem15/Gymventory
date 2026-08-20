import db from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { filterExercisesByAge } from '$lib/exerciseRecommendations';
import { calculateAge } from '$lib/age';

export interface RecommendedExercise {
	id: number;
	name: string;
	target_muscle: string;
	instructions: string | null;
	required_equipment: string;
	is_training_specific: number;
}

export const load: PageServerLoad = ({ locals }) => {
	const userId = locals.user!.id;

	// Fetch user's training type and birth date
	const user = db
		.prepare('SELECT training_type, birth_date FROM users WHERE id = ?')
		.get(userId) as { training_type: string; birth_date: string };

	const trainingType = user?.training_type ?? 'fitness';
	// Compute age dynamically from birth date
	const userAge = user?.birth_date ? calculateAge(user.birth_date) : null;

	// Query exercises where ALL required equipment is in this user's inventory,
	// prioritizing exercises linked to the user's training type
	const recommendedExercises = db
		.prepare(
			`
		SELECT 
			e.id,
			e.name,
			e.target_muscle,
			e.instructions,
			GROUP_CONCAT(eq.name, ', ') AS required_equipment,
			CASE WHEN te.training_type_id IS NOT NULL THEN 1 ELSE 0 END AS is_training_specific
		FROM exercises e
		JOIN exercise_equipment ee ON e.id = ee.exercise_id
		JOIN equipment eq ON ee.equipment_id = eq.id
		LEFT JOIN training_exercises te ON e.id = te.exercise_id
			AND te.training_type_id = (SELECT id FROM training_types WHERE name = ?)
		WHERE e.id NOT IN (
			-- Exclude exercises that require equipment NOT in this user's inventory
			SELECT exercise_id 
			FROM exercise_equipment 
			WHERE equipment_id NOT IN (
				SELECT equipment_id FROM user_inventory WHERE user_id = ?
			)
		)
		GROUP BY e.id
		ORDER BY is_training_specific DESC, e.target_muscle ASC, e.name ASC
	`
		)
		.all(trainingType, userId) as RecommendedExercise[];

	// Filter out high-impact exercises that are unsafe for the user's age
	const ageFilteredExercises = filterExercisesByAge(recommendedExercises, userAge);

	// Fetch the training type description
	const trainingTypeInfo = db
		.prepare('SELECT name, description FROM training_types WHERE name = ?')
		.get(trainingType) as { name: string; description: string } | undefined;

	// Fetch this user's equipment count to handle empty states gracefully
	const userInventoryCount = db
		.prepare('SELECT COUNT(*) as count FROM user_inventory WHERE user_id = ?')
		.get(userId) as { count: number };

	// Fetch recommended equipment for this training type
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
		.all(trainingType) as { id: number; name: string }[];

	const trainingTypeLabels: Record<string, string> = {
		fitness: 'Fitness & Weight Loss',
		bodybuilding: 'Bodybuilding',
		boxing: 'Boxing',
		kickboxing: 'Kickboxing',
		kungfu: 'Kung Fu',
		swimming: 'Swimming'
	};

	return {
		user: locals.user,
		trainingType,
		trainingTypeLabel: trainingTypeLabels[trainingType] ?? trainingType,
		trainingTypeDescription: trainingTypeInfo?.description ?? null,
		recommendedEquipment,
		exercises: ageFilteredExercises,
		hasInventory: userInventoryCount.count > 0
	};
};