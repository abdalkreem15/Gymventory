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
`);

// Seed default equipment list if empty
const count = db.prepare('SELECT COUNT(*) as count FROM equipment').get() as { count: number };

if (count.count === 0) {
	const defaultEquipment = [
		'Barbell',
		'Dumbbells',
		'Kettlebell',
		'Pull-up Bar',
		'Adjustable Bench',
		'Squat Rack',
		'Resistance Bands',
		'Cable Machine',
		'Treadmill',
		'Stationary Bike',
		'Rowing Machine',
		'Exercise Mat'
	];

	const insertStmt = db.prepare('INSERT INTO equipment (name) VALUES (?)');
	const seedTransaction = db.transaction((items: string[]) => {
		for (const item of items) {
			insertStmt.run(item);
		}
	});

	seedTransaction(defaultEquipment);
}

export default db;
