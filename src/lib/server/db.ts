import Database from 'better-sqlite3';

const db = new Database('gymventory.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT NOT NULL DEFAULT 'male',
        training_type TEXT NOT NULL DEFAULT 'fitness',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_inventory (
        user_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, equipment_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        target_muscle TEXT NOT NULL,
        instructions TEXT
    );

    CREATE TABLE IF NOT EXISTS exercise_equipment (
        exercise_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        PRIMARY KEY (exercise_id, equipment_id),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS training_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS training_exercises (
        training_type_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        PRIMARY KEY (training_type_id, exercise_id),
        FOREIGN KEY (training_type_id) REFERENCES training_types(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        height_cm REAL NOT NULL,
        neck_cm REAL NOT NULL,
        waist_cm REAL NOT NULL,
        hip_cm REAL,
        measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

// Seed default equipment and exercises only if the database has none yet
const exerciseCount = db
	.prepare('SELECT COUNT(*) as count FROM exercises')
	.get() as { count: number };

if (exerciseCount.count === 0) {
	// Canonical merged equipment list (15 core items + 5 extras + sport-specific gear)
	const equipmentList = [
		'Bodyweight',
		'Dumbbells',
		'Barbell',
		'Adjustable Bench',
		'Pull-up Bar',
		'Leg Press Machine',
		'Cable Machine',
		'Lat Pulldown Machine',
		'Leg Extension Machine',
		'Seated Leg Curl Machine',
		'Smith Machine',
		'Pec Deck / Fly Machine',
		'Dip Station',
		'Resistance Bands',
		'Kettlebells',
		'Squat Rack',
		'Treadmill',
		'Stationary Bike',
		'Rowing Machine',
		'Exercise Mat',
		'Boxing Gloves',
		'Heavy Bag',
		'Speed Bag',
		'Jump Rope',
		'Kickboxing Pads',
		'Pull Buoy',
		'Kickboard',
		'Swim Fins'
	];

	// Mapping exercises to target muscles & required equipment
	const exercisesList: {
		name: string;
		target_muscle: string;
		instructions: string;
		equipment: string[];
		training_types: string[];
	}[] = [
		// --- CHEST ---
		{
			name: 'Push-ups',
			target_muscle: 'Chest',
			instructions: 'Keep your body in a straight line, lower your chest near the floor, and push up.',
			equipment: ['Bodyweight'],
			training_types: ['fitness', 'bodybuilding', 'kickboxing', 'boxing', 'kungfu']
		},
		{
			name: 'Dumbbell Bench Press',
			target_muscle: 'Chest',
			instructions: 'Lie on a flat bench, press dumbbells vertically over your chest, and control the descent.',
			equipment: ['Dumbbells', 'Adjustable Bench'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Barbell Bench Press',
			target_muscle: 'Chest',
			instructions: 'Unrack the barbell, lower it to mid-chest with elbows at ~45 degrees, and press up firmly.',
			equipment: ['Barbell', 'Adjustable Bench'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Chest Fly (Pec Deck)',
			target_muscle: 'Chest',
			instructions: 'Sit against the back pad, place handles at chest height, and squeeze your chest inward.',
			equipment: ['Pec Deck / Fly Machine'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Cable Crossover',
			target_muscle: 'Chest',
			instructions: 'Set pulleys at upper or middle height, pull handles downward and across your chest.',
			equipment: ['Cable Machine'],
			training_types: ['bodybuilding', 'fitness']
		},

		// --- BACK ---
		{
			name: 'Pull-ups',
			target_muscle: 'Back',
			instructions: 'Grasp the bar overhand slightly wider than shoulder-width; pull until chin clears the bar.',
			equipment: ['Pull-up Bar'],
			training_types: ['bodybuilding', 'fitness', 'kungfu']
		},
		{
			name: 'Lat Pulldown',
			target_muscle: 'Back',
			instructions: 'Grip the wide bar, sit tightly under thigh pads, and pull down towards upper chest.',
			equipment: ['Lat Pulldown Machine'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Bent-Over Barbell Row',
			target_muscle: 'Back',
			instructions: 'Hinge forward at hips with a flat back, pulling the barbell up towards your navel.',
			equipment: ['Barbell'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Seated Cable Row',
			target_muscle: 'Back',
			instructions: 'Sit facing the pulley with knees slightly bent, pull attachment to waist keeping torso steady.',
			equipment: ['Cable Machine'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'One-Arm Dumbbell Row',
			target_muscle: 'Back',
			instructions: 'Place one knee and hand on bench, brace your core, and pull dumbbell up to your hip.',
			equipment: ['Dumbbells', 'Adjustable Bench'],
			training_types: ['bodybuilding', 'fitness']
		},

		// --- LEGS ---
		{
			name: 'Leg Press',
			target_muscle: 'Legs',
			instructions: 'Place feet hip-width on sled platform, unlatch safeties, lower platform, and press up with heels.',
			equipment: ['Leg Press Machine'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Barbell Squat',
			target_muscle: 'Legs',
			instructions: 'Rest barbell across upper back, bend knees/hips down to 90 degrees, and drive back up.',
			equipment: ['Barbell'],
			training_types: ['bodybuilding', 'fitness', 'kickboxing', 'boxing']
		},
		{
			name: 'Goblet Squat',
			target_muscle: 'Legs',
			instructions: 'Hold dumbbell vertically against chest, keep torso upright, and squat down deep between knees.',
			equipment: ['Dumbbells'],
			training_types: ['fitness', 'bodybuilding', 'kickboxing', 'boxing']
		},
		{
			name: 'Leg Extensions',
			target_muscle: 'Legs',
			instructions: 'Adjust pad against lower shins and extend legs upward to fully isolate quadriceps.',
			equipment: ['Leg Extension Machine'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Seated Leg Curl',
			target_muscle: 'Legs',
			instructions: 'Place pad over upper calves, curl legs down toward seat bottom to target hamstrings.',
			equipment: ['Seated Leg Curl Machine'],
			training_types: ['bodybuilding']
		},

		// --- SHOULDERS ---
		{
			name: 'Overhead Barbell Press',
			target_muscle: 'Shoulders',
			instructions: 'Stand tall with core tight, press barbell overhead until arms lock out directly overhead.',
			equipment: ['Barbell'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Seated Dumbbell Shoulder Press',
			target_muscle: 'Shoulders',
			instructions: 'Sit on upright bench, press dumbbells upward from ear level until overhead.',
			equipment: ['Dumbbells', 'Adjustable Bench'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Dumbbell Lateral Raises',
			target_muscle: 'Shoulders',
			instructions: 'Raise dumbbells outward to the sides until parallel with floor with slight bend in elbows.',
			equipment: ['Dumbbells'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Cable Lateral Raise',
			target_muscle: 'Shoulders',
			instructions: 'Set low pulley attachment, pull cable across body sideways up to shoulder level.',
			equipment: ['Cable Machine'],
			training_types: ['bodybuilding']
		},

		// --- ARMS (BICEPS & TRICEPS) ---
		{
			name: 'Tricep Cable Pushdown',
			target_muscle: 'Triceps',
			instructions: 'Attach rope or bar to high pulley, pin elbows to sides, and extend forearms downward.',
			equipment: ['Cable Machine'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Tricep Dips',
			target_muscle: 'Triceps',
			instructions: 'Support bodyweight on parallel dip handles, lower body until elbows hit 90 degrees, and push up.',
			equipment: ['Dip Station'],
			training_types: ['bodybuilding', 'fitness', 'kungfu']
		},
		{
			name: 'Dumbbell Bicep Curl',
			target_muscle: 'Biceps',
			instructions: 'Keep upper arms still, curl weights forward toward shoulders while supinating wrists.',
			equipment: ['Dumbbells'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Barbell Bicep Curl',
			target_muscle: 'Biceps',
			instructions: 'Hold barbell with underhand grip shoulder-width apart, curl weight up towards chest.',
			equipment: ['Barbell'],
			training_types: ['bodybuilding']
		},

		// --- MULTI-USE / HYBRID ---
		{
			name: 'Smith Machine Squat',
			target_muscle: 'Legs',
			instructions: 'Position bar across shoulders, unhook guided safety latches, and squat downward on fixed rails.',
			equipment: ['Smith Machine'],
			training_types: ['bodybuilding', 'fitness']
		},
		{
			name: 'Kettlebell Swings',
			target_muscle: 'Legs',
			instructions: 'Hinge at hips to swing kettlebell between legs, snap hips forward explosively to shoulder level.',
			equipment: ['Kettlebells'],
			training_types: ['fitness', 'kickboxing', 'boxing']
		},

		// --- CARDIO / CONDITIONING (Fitness) ---
		{
			name: 'Treadmill Interval Sprints',
			target_muscle: 'Cardio',
			instructions: 'Alternate 1 minute of high-intensity running with 2 minutes of walking for 20-30 minutes.',
			equipment: ['Treadmill'],
			training_types: ['fitness']
		},
		{
			name: 'Stationary Bike Intervals',
			target_muscle: 'Cardio',
			instructions: 'Pedal at high resistance for 30 seconds, then recover at low resistance for 90 seconds. Repeat 10 times.',
			equipment: ['Stationary Bike'],
			training_types: ['fitness', 'kickboxing', 'boxing']
		},
		{
			name: 'Rowing Machine Intervals',
			target_muscle: 'Cardio',
			instructions: 'Row hard for 500m, rest 60 seconds, then repeat for 5-8 total rounds for full-body conditioning.',
			equipment: ['Rowing Machine'],
			training_types: ['fitness', 'kickboxing', 'boxing']
		},
		{
			name: 'Jump Rope Intervals',
			target_muscle: 'Cardio',
			instructions: 'Jump rope for 60 seconds at high speed, rest 30 seconds. Repeat for 10 rounds to build endurance.',
			equipment: ['Jump Rope'],
			training_types: ['fitness', 'kickboxing', 'boxing', 'swimming']
		},
		{
			name: 'Burpee Circuit',
			target_muscle: 'Full Body',
			instructions: 'Perform burpees for 45 seconds, rest 15 seconds. Complete 8 rounds for a full-body fat-burning circuit.',
			equipment: ['Bodyweight'],
			training_types: ['fitness', 'kickboxing', 'boxing', 'kungfu']
		},
		{
			name: 'Plank Hold',
			target_muscle: 'Core',
			instructions: 'Hold a high or forearm plank with a straight body line for 45-90 seconds. Repeat 3-4 times.',
			equipment: ['Exercise Mat', 'Bodyweight'],
			training_types: ['fitness', 'kickboxing', 'boxing', 'kungfu', 'swimming']
		},

		// --- BODYBUILDING SPECIFIC ---
		{
			name: 'Barbell Romanian Deadlift',
			target_muscle: 'Hamstrings',
			instructions: 'Hinge at hips with soft knees, lower the barbell along your legs until you feel a hamstring stretch, then drive hips forward.',
			equipment: ['Barbell'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Dumbbell Shrugs',
			target_muscle: 'Traps',
			instructions: 'Hold dumbbells at your sides and shrug your shoulders straight up toward your ears, then lower under control.',
			equipment: ['Dumbbells'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Cable Crunches',
			target_muscle: 'Abs',
			instructions: 'Kneel beneath a high pulley, hold the rope at your head, and crunch your elbows toward your thighs.',
			equipment: ['Cable Machine'],
			training_types: ['bodybuilding']
		},
		{
			name: 'Dumbbell Chest Fly',
			target_muscle: 'Chest',
			instructions: 'Lie on a bench with dumbbells overhead, lower them in a wide arc until chest stretches, then squeeze back up.',
			equipment: ['Dumbbells', 'Adjustable Bench'],
			training_types: ['bodybuilding']
		},

		// --- BOXING SPECIFIC ---
		{
			name: 'Shadow Boxing',
			target_muscle: 'Full Body',
			instructions: 'Practice jab, cross, hook and uppercut combinations in front of a mirror for 3 rounds of 3 minutes with 1-minute rests.',
			equipment: ['Bodyweight'],
			training_types: ['boxing']
		},
		{
			name: 'Heavy Bag Workout',
			target_muscle: 'Full Body',
			instructions: 'Hit the heavy bag with combination punching for 3-minute rounds, resting 1 minute between rounds. Focus on power and technique.',
			equipment: ['Boxing Gloves', 'Heavy Bag'],
			training_types: ['boxing']
		},
		{
			name: 'Speed Bag Drills',
			target_muscle: 'Shoulders',
			instructions: 'Hit the speed bag in a rhythmic circular motion for 3-minute rounds to build hand speed and shoulder endurance.',
			equipment: ['Speed Bag'],
			training_types: ['boxing']
		},
		{
			name: 'Boxers Footwork Drills',
			target_muscle: 'Legs',
			instructions: 'Practice bobbing, weaving, pivots, and lateral movement patterns for 3 rounds of 3 minutes to improve ring mobility.',
			equipment: ['Jump Rope', 'Bodyweight'],
			training_types: ['boxing']
		},
		{
			name: 'Boxer Push-Ups',
			target_muscle: 'Chest',
			instructions: 'Perform explosive clap push-ups for 30 seconds, rest 30 seconds. 5 rounds to build explosive punching power.',
			equipment: ['Bodyweight'],
			training_types: ['boxing']
		},

		// --- KICKBOXING SPECIFIC ---
		{
			name: 'Kickboxing Pad Drills',
			target_muscle: 'Full Body',
			instructions: 'Practice jab-cross-roundhouse kick combinations on pads for 3-minute rounds with 1-minute rest between rounds.',
			equipment: ['Kickboxing Pads'],
			training_types: ['kickboxing']
		},
		{
			name: 'Heavy Bag Kicking Workout',
			target_muscle: 'Legs',
			instructions: 'Alternate low kicks, body kicks, and high kicks on the heavy bag for 3-minute rounds, resting 1 minute between rounds.',
			equipment: ['Boxing Gloves', 'Heavy Bag'],
			training_types: ['kickboxing']
		},
		{
			name: 'Shadow Kickboxing',
			target_muscle: 'Full Body',
			instructions: 'Practice kicking combinations including roundhouse, front push kick and switch kicks for 3 rounds of 3 minutes.',
			equipment: ['Bodyweight'],
			training_types: ['kickboxing']
		},
		{
			name: 'Knee Strikes on Heavy Bag',
			target_muscle: 'Core',
			instructions: 'Hold the heavy bag and drive alternating knee strikes into it for 60-second rounds with 30-second rests.',
			equipment: ['Heavy Bag'],
			training_types: ['kickboxing']
		},

		// --- KUNG FU SPECIFIC ---
		{
			name: 'Kung Fu Horse Stance',
			target_muscle: 'Legs',
			instructions: 'Stand with feet wide, sink hips until thighs are parallel to ground, and hold for 1-3 minutes to build leg endurance.',
			equipment: ['Bodyweight'],
			training_types: ['kungfu']
		},
		{
			name: 'Kung Fu Forms Practice',
			target_muscle: 'Full Body',
			instructions: 'Practice your chosen kung fu form slowly with intention, focusing on precise technique, balance, and breathing.',
			equipment: ['Bodyweight'],
			training_types: ['kungfu']
		},
		{
			name: 'Front Kick Drills',
			target_muscle: 'Legs',
			instructions: 'Practice chambering and snapping front kicks in a stationary stance, 20 repetitions per leg, focusing on speed and snap.',
			equipment: ['Bodyweight'],
			training_types: ['kungfu']
		},
		{
			name: 'Resistance Band Strikes',
			target_muscle: 'Full Body',
			instructions: 'Anchor a resistance band and practice punching and kicking against the resistance to build explosive power.',
			equipment: ['Resistance Bands'],
			training_types: ['kungfu']
		},
		{
			name: 'Tiger Claw Conditioning',
			target_muscle: 'Forearms',
			instructions: 'Perform fingertip push-ups and claw-grip exercises to condition the hands and forearms for kung fu gripping techniques.',
			equipment: ['Bodyweight'],
			training_types: ['kungfu']
		},

		// --- SWIMMING SPECIFIC ---
		{
			name: 'Freestyle Swim Sprints',
			target_muscle: 'Full Body',
			instructions: 'Swim 50m freestyle at maximum effort, rest 30 seconds, and repeat 10 times to build swim-specific endurance.',
			equipment: ['Pull Buoy'],
			training_types: ['swimming']
		},
		{
			name: 'Kickboard Leg Drills',
			target_muscle: 'Legs',
			instructions: 'Hold a kickboard and kick 100m using flutter, dolphin, or breaststroke kicks. Rest and repeat 5 times.',
			equipment: ['Kickboard'],
			training_types: ['swimming']
		},
		{
			name: 'Pull Buoy Technique Work',
			target_muscle: 'Upper Body',
			instructions: 'Place the pull buoy between your legs and swim freestyle focusing only on arm pull technique for 200m repeats.',
			equipment: ['Pull Buoy'],
			training_types: ['swimming']
		},
		{
			name: 'Swim Fins Sprint Intervals',
			target_muscle: 'Legs',
			instructions: 'Wear swim fins and perform 25m sprint intervals with 15-second rests to build leg power and ankle flexibility.',
			equipment: ['Swim Fins'],
			training_types: ['swimming']
		},
		{
			name: 'Underwater Dolphin Kicks',
			target_muscle: 'Core',
			instructions: 'Push off the wall and perform underwater dolphin kicks for 15-25 meters with fins, focusing on a strong undulating body wave.',
			equipment: ['Swim Fins'],
			training_types: ['swimming']
		}
	];

	// Training types definitions
	const trainingTypesList = [
		{ name: 'fitness', description: 'Lose weight and improve overall fitness with cardio and full-body strength circuits.' },
		{ name: 'bodybuilding', description: 'Increase muscle mass with hypertrophy-focused splits and progressive overload.' },
		{ name: 'boxing', description: 'Train like a boxer with heavy bag work, speed bag drills, and footwork.' },
		{ name: 'kickboxing', description: 'Mix boxing punches with kicks using pad work, heavy bag, and conditioning.' },
		{ name: 'kungfu', description: 'Traditional martial arts training with stances, forms, and conditioning drills.' },
		{ name: 'swimming', description: 'Sport-specific swim training with sprints, kickboard drills, and technique work.' }
	];

	// Prepare SQL statements
	const insertEquipmentStmt = db.prepare('INSERT OR IGNORE INTO equipment (name) VALUES (?)');
	const insertExerciseStmt = db.prepare(
		'INSERT INTO exercises (name, target_muscle, instructions) VALUES (?, ?, ?)'
	);
	const linkEquipmentStmt = db.prepare(
		'INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (?, ?)'
	);
	const insertTrainingTypeStmt = db.prepare(
		'INSERT INTO training_types (name, description) VALUES (?, ?)'
	);
	const linkTrainingExerciseStmt = db.prepare(
		'INSERT INTO training_exercises (training_type_id, exercise_id) VALUES (?, ?)'
	);

	// Execute seeding inside a single database transaction
	const seedTransaction = db.transaction(() => {
		// Insert all equipment (IGNORE preserves any existing rows and their IDs)
		for (const item of equipmentList) {
			insertEquipmentStmt.run(item);
		}

		// Build name → id map from actual database rows
		const equipmentRows = db.prepare('SELECT id, name FROM equipment').all() as {
			id: number;
			name: string;
		}[];
		const equipmentIdMap = new Map<string, number>(
			equipmentRows.map((row) => [row.name, row.id])
		);

		// Insert training types
		for (const trainingType of trainingTypesList) {
			insertTrainingTypeStmt.run(trainingType.name, trainingType.description);
		}

		const trainingTypeRows = db.prepare('SELECT id, name FROM training_types').all() as {
			id: number;
			name: string;
		}[];
		const trainingTypeIdMap = new Map<string, number>(
			trainingTypeRows.map((row) => [row.name, row.id])
		);

		// Insert exercises and link their required equipment + training types
		for (const exercise of exercisesList) {
			const exerciseInfo = insertExerciseStmt.run(
				exercise.name,
				exercise.target_muscle,
				exercise.instructions
			);
			const exerciseId = exerciseInfo.lastInsertRowid as number;

			// Link equipment requirements
			for (const reqEquipmentName of exercise.equipment) {
				const equipmentId = equipmentIdMap.get(reqEquipmentName);
				if (equipmentId) {
					linkEquipmentStmt.run(exerciseId, equipmentId);
				}
			}

			// Link training type associations
			for (const trainingTypeName of exercise.training_types) {
				const trainingTypeId = trainingTypeIdMap.get(trainingTypeName);
				if (trainingTypeId) {
					linkTrainingExerciseStmt.run(trainingTypeId, exerciseId);
				}
			}
		}
	});

	seedTransaction();
	console.log('Database seeded with gym equipment, exercises & training types.');
}

export default db;