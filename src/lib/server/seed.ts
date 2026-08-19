import db from './db';

interface SeedItem {
	name: string;
}

interface SeedExercise {
	name: string;
	target_muscle: string;
	instructions: string;
	equipment: string[];
}

export function seedDatabase(): void {
	// 1. Wipe existing seed data to allow clean re-runs
	db.exec(`
		DELETE FROM exercise_equipment;
		DELETE FROM exercises;
		DELETE FROM equipment;
		DELETE FROM sqlite_sequence WHERE name IN ('equipment', 'exercises');
	`);

	// 2. Comprehensive list of common gym equipment & machines
	const equipmentList: SeedItem[] = [
		{ name: 'Bodyweight' },
		{ name: 'Dumbbells' },
		{ name: 'Barbell' },
		{ name: 'Adjustable Bench' },
		{ name: 'Pull-up Bar' },
		{ name: 'Leg Press Machine' },
		{ name: 'Cable Machine' },
		{ name: 'Lat Pulldown Machine' },
		{ name: 'Leg Extension Machine' },
		{ name: 'Seated Leg Curl Machine' },
		{ name: 'Smith Machine' },
		{ name: 'Pec Deck / Fly Machine' },
		{ name: 'Dip Station' },
		{ name: 'Resistance Bands' },
		{ name: 'Kettlebells' }
	];

	// 3. Mapping exercises to target muscles & required equipment
	const exercisesList: SeedExercise[] = [
		// --- CHEST ---
		{
			name: 'Push-ups',
			target_muscle: 'Chest',
			instructions: 'Keep your body in a straight line, lower your chest near the floor, and push up.',
			equipment: ['Bodyweight']
		},
		{
			name: 'Dumbbell Bench Press',
			target_muscle: 'Chest',
			instructions: 'Lie on a flat bench, press dumbbells vertically over your chest, and control the descent.',
			equipment: ['Dumbbells', 'Adjustable Bench']
		},
		{
			name: 'Barbell Bench Press',
			target_muscle: 'Chest',
			instructions: 'Unrack the barbell, lower it to mid-chest with elbows at ~45 degrees, and press up firmly.',
			equipment: ['Barbell', 'Adjustable Bench']
		},
		{
			name: 'Chest Fly (Pec Deck)',
			target_muscle: 'Chest',
			instructions: 'Sit against the back pad, place handles at chest height, and squeeze your chest inward.',
			equipment: ['Pec Deck / Fly Machine']
		},
		{
			name: 'Cable Crossover',
			target_muscle: 'Chest',
			instructions: 'Set pulleys at upper or middle height, pull handles downward and across your chest.',
			equipment: ['Cable Machine']
		},

		// --- BACK ---
		{
			name: 'Pull-ups',
			target_muscle: 'Back',
			instructions: 'Grasp the bar overhand slightly wider than shoulder-width; pull until chin clears the bar.',
			equipment: ['Pull-up Bar']
		},
		{
			name: 'Lat Pulldown',
			target_muscle: 'Back',
			instructions: 'Grip the wide bar, sit tightly under thigh pads, and pull down towards upper chest.',
			equipment: ['Lat Pulldown Machine']
		},
		{
			name: 'Bent-Over Barbell Row',
			target_muscle: 'Back',
			instructions: 'Hinge forward at hips with a flat back, pulling the barbell up towards your navel.',
			equipment: ['Barbell']
		},
		{
			name: 'Seated Cable Row',
			target_muscle: 'Back',
			instructions: 'Sit facing the pulley with knees slightly bent, pull attachment to waist keeping torso steady.',
			equipment: ['Cable Machine']
		},
		{
			name: 'One-Arm Dumbbell Row',
			target_muscle: 'Back',
			instructions: 'Place one knee and hand on bench, brace your core, and pull dumbbell up to your hip.',
			equipment: ['Dumbbells', 'Adjustable Bench']
		},

		// --- LEGS ---
		{
			name: 'Leg Press',
			target_muscle: 'Legs',
			instructions: 'Place feet hip-width on sled platform, unlatch safeties, lower platform, and press up with heels.',
			equipment: ['Leg Press Machine']
		},
		{
			name: 'Barbell Squat',
			target_muscle: 'Legs',
			instructions: 'Rest barbell across upper back, bend knees/hips down to 90 degrees, and drive back up.',
			equipment: ['Barbell']
		},
		{
			name: 'Goblet Squat',
			target_muscle: 'Legs',
			instructions: 'Hold dumbbell vertically against chest, keep torso upright, and squat down deep between knees.',
			equipment: ['Dumbbells']
		},
		{
			name: 'Leg Extensions',
			target_muscle: 'Legs',
			instructions: 'Adjust pad against lower shins and extend legs upward to fully isolate quadriceps.',
			equipment: ['Leg Extension Machine']
		},
		{
			name: 'Seated Leg Curl',
			target_muscle: 'Legs',
			instructions: 'Place pad over upper calves, curl legs down toward seat bottom to target hamstrings.',
			equipment: ['Seated Leg Curl Machine']
		},

		// --- SHOULDERS ---
		{
			name: 'Overhead Barbell Press',
			target_muscle: 'Shoulders',
			instructions: 'Stand tall with core tight, press barbell overhead until arms lock out directly overhead.',
			equipment: ['Barbell']
		},
		{
			name: 'Seated Dumbbell Shoulder Press',
			target_muscle: 'Shoulders',
			instructions: 'Sit on upright bench, press dumbbells upward from ear level until overhead.',
			equipment: ['Dumbbells', 'Adjustable Bench']
		},
		{
			name: 'Dumbbell Lateral Raises',
			target_muscle: 'Shoulders',
			instructions: 'Raise dumbbells outward to the sides until parallel with floor with slight bend in elbows.',
			equipment: ['Dumbbells']
		},
		{
			name: 'Cable Lateral Raise',
			target_muscle: 'Shoulders',
			instructions: 'Set low pulley attachment, pull cable across body sideways up to shoulder level.',
			equipment: ['Cable Machine']
		},

		// --- ARMS (BICEPS & TRICEPS) ---
		{
			name: 'Tricep Cable Pushdown',
			target_muscle: 'Triceps',
			instructions: 'Attach rope or bar to high pulley, pin elbows to sides, and extend forearms downward.',
			equipment: ['Cable Machine']
		},
		{
			name: 'Tricep Dips',
			target_muscle: 'Triceps',
			instructions: 'Support bodyweight on parallel dip handles, lower body until elbows hit 90 degrees, and push up.',
			equipment: ['Dip Station']
		},
		{
			name: 'Dumbbell Bicep Curl',
			target_muscle: 'Biceps',
			instructions: 'Keep upper arms still, curl weights forward toward shoulders while supinating wrists.',
			equipment: ['Dumbbells']
		},
		{
			name: 'Barbell Bicep Curl',
			target_muscle: 'Biceps',
			instructions: 'Hold barbell with underhand grip shoulder-width apart, curl weight up towards chest.',
			equipment: ['Barbell']
		},

		// --- MULTI-USE / HYBRID ---
		{
			name: 'Smith Machine Squat',
			target_muscle: 'Legs',
			instructions: 'Position bar across shoulders, unhook guided safety latches, and squat downward on fixed rails.',
			equipment: ['Smith Machine']
		},
		{
			name: 'Kettlebell Swings',
			target_muscle: 'Legs',
			instructions: 'Hinge at hips to swing kettlebell between legs, snap hips forward explosively to shoulder level.',
			equipment: ['Kettlebells']
		}
	];

	// Prepare SQL Statements
	const insertEquipmentStmt = db.prepare('INSERT INTO equipment (name) VALUES (?)');
	const insertExerciseStmt = db.prepare(
		'INSERT INTO exercises (name, target_muscle, instructions) VALUES (?, ?, ?)'
	);
	const linkEquipmentStmt = db.prepare(
		'INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (?, ?)'
	);

	// Execute inside single database transaction
	const seedTransaction = db.transaction(() => {
		// Map equipment name to database primary key ID
		const equipmentIdMap = new Map<string, number>();

		for (const item of equipmentList) {
			const info = insertEquipmentStmt.run(item.name);
			equipmentIdMap.set(item.name, info.lastInsertRowid as number);
		}

		for (const exercise of exercisesList) {
			const exerciseInfo = insertExerciseStmt.run(
				exercise.name,
				exercise.target_muscle,
				exercise.instructions
			);
			const exerciseId = exerciseInfo.lastInsertRowid as number;

			// Link required equipment to exercise
			for (const reqEquipmentName of exercise.equipment) {
				const equipmentId = equipmentIdMap.get(reqEquipmentName);
				if (equipmentId) {
					linkEquipmentStmt.run(exerciseId, equipmentId);
				}
			}
		}
	});

	seedTransaction();
	console.log('Database successfully seeded with comprehensive gym equipment & exercises!');
}

seedDatabase();
