# Gymventory

#### Video Demo: https://www.youtube.com/watch?v=dQw4w9WgXcQ
#### Description:

Gymventory is a web application that helps gym-goers manage their equipment inventory and receive personalized workout recommendations. Instead of browsing generic workout lists that may require equipment you don't have, Gymventory lets you select the equipment available in your gym or home setup and then recommends exercises you can actually perform right now. The app also tracks your body metrics — including BMI, body fat percentage, and a suggested "perfect weight" — and adjusts exercise recommendations based on your age for safety.

The application supports six training goals: **Fitness & Weight Loss**, **Bodybuilding**, **Boxing**, **Kickboxing**, **Kung Fu**, and **Swimming**. Each goal unlocks sport-specific exercises and equipment recommendations tailored to that discipline.

## Features

- **User Authentication** — Register and log in with securely hashed passwords (scrypt with per-user salt) and HTTP-only session cookies.
- **Body Metrics Tracking** — Record weight, height, neck, waist, and hip measurements. The app calculates BMI (with age-adjusted thresholds for users 65+), body fat percentage using the U.S. Navy method, and a suggested "perfect weight" range based on your height.
- **Equipment Inventory** — Select which gym equipment you have access to via an intuitive checkbox interface. Your selection is saved atomically using a database transaction.
- **Smart Workout Recommendations** — Exercises are filtered so that only those whose *entire* required equipment set is in your inventory are shown. Results are prioritized by your chosen training type, with sport-specific exercises appearing first.
- **Age-Based Safety Filtering** — High-impact and high-intensity exercises (e.g., burpees, jump rope, heavy bag work) are automatically filtered out for older users based on a configurable age threshold per exercise.
- **Measurement History** — View a chronological table of all past measurements with computed BMI and body fat categories.
- **Profile Management** — Update your birth date, target weight, and training goal at any time. You can also permanently delete your account.

## File Structure

```
Gymventory/
├── README.md                          # This file
├── package.json                       # Project metadata and npm scripts
├── tsconfig.json                      # TypeScript compiler configuration
├── vite.config.ts                     # Vite + SvelteKit + Tailwind build configuration
├── eslint.config.js                   # ESLint linting rules
├── prettier.config.js                 # Prettier formatting rules
├── .prettierignore                    # Files excluded from Prettier formatting
├── .gitignore                         # Git ignore rules
├── .npmrc                             # npm configuration (engine-strict)
├── gymventory.db                      # SQLite database (auto-created on first run)
├── static/
│   └── robots.txt                     # Search engine crawler directives
└── src/
    ├── app.html                       # Root HTML template
    ├── app.d.ts                       # TypeScript type declarations (App.Locals)
    ├── hooks.server.ts                # Server-side hook: session auth & route protection
    ├── routes/
    │   ├── +layout.svelte             # Root layout with navigation header
    │   ├── +layout.server.ts          # Layout server load (passes user to layout)
    │   ├── +page.svelte               # Home page: equipment inventory selection
    │   ├── +page.server.ts            # Home page server: load equipment, save inventory
    │   ├── layout.css                 # Tailwind CSS imports
    │   ├── login/
    │   │   ├── +page.svelte           # Login form UI
    │   │   └── +page.server.ts        # Login action: password verification & session
    │   ├── logout/
    │   │   └── +page.server.ts        # Logout action: clears session cookie
    │   ├── register/
    │   │   ├── +page.svelte           # Registration form with live BMI preview
    │   │   └── +page.server.ts        # Registration action: validation & user creation
    │   ├── profile/
    │   │   ├── +page.svelte           # Profile page: stats, measurements, goals
    │   │   └── +page.server.ts        # Profile server: load metrics, handle updates
    │   └── workouts/
    │       ├── +page.svelte           # Workout recommendations display
    │       └── +page.server.ts        # Workout server: query & filter exercises
    └── lib/
        ├── index.ts                   # Library barrel file
        ├── age.ts                     # Date parsing, age calculation, validation
        ├── bodyMetrics.ts             # BMI, body fat %, perfect weight calculations
        ├── exerciseRecommendations.ts # Age-based exercise filtering logic
        ├── DatePicker.svelte          # Custom calendar date picker component
        ├── assets/
        │   └── favicon.svg            # Application favicon
        └── server/
            └── db.ts                  # SQLite database init, schema, and seeding
```

### Key Source Files Explained

**`src/lib/server/db.ts`** — The heart of the application's data layer. It initializes a SQLite database using `better-sqlite3`, defines the full schema (8 tables: `users`, `equipment`, `user_inventory`, `exercises`, `exercise_equipment`, `training_types`, `training_exercises`, `body_measurements`), and seeds the database with 28 pieces of equipment, 50+ exercises across 6 training types, and their equipment/training-type associations. All seeding runs inside a single transaction for atomicity.

**`src/hooks.server.ts`** — A SvelteKit server hook that runs on every request. It reads the `session_user_id` cookie, loads the corresponding user from the database, computes their age, and attaches the user object to `event.locals`. It also enforces authentication: unauthenticated users are redirected to `/login` for all routes except login and register.

**`src/lib/bodyMetrics.ts`** — Contains all body composition calculations. BMI is computed using the standard formula (kg/m²) with age-adjusted categories for users 65+ (using 22–27 as the "normal" range instead of 18.5–24.9). Body fat percentage uses the U.S. Navy method (logarithmic formula based on waist, neck, and hip circumferences). The "perfect weight" function derives a healthy weight range from height and age-adjusted BMI thresholds.

**`src/lib/age.ts`** — Handles all date operations: parsing DD/MM/YYYY and YYYY-MM-DD formats, converting between them, calculating age from a birth date (accounting for whether the birthday has passed this year), and validating that birth dates are real calendar dates within a reasonable range (1900–present, minimum age 13).

**`src/lib/exerciseRecommendations.ts`** — Defines a list of high-impact exercises and their minimum safe age thresholds. The `filterExercisesByAge` function removes exercises that are unsafe for a user's age group, ensuring older users don't receive recommendations for activities like burpees, jump rope, or heavy bag kicking.

**`src/lib/DatePicker.svelte`** — A custom calendar date picker component with month/year navigation, a 12-year grid view, date validation (no future dates, no dates before 1900), and click-outside-to-close behavior. It supports both manual text input (DD/MM/YYYY) and calendar selection.

**`src/routes/workouts/+page.server.ts`** — The recommendation engine. It queries the database for exercises where *all* required equipment is in the user's inventory (using a `NOT IN` subquery), prioritizes training-type-specific exercises, and applies age-based filtering. The results are grouped by target muscle group on the frontend.

## Design Decisions

**SQLite over PostgreSQL/MySQL** — For a single-user, single-machine application like this, SQLite (via `better-sqlite3`) provides excellent performance with zero configuration. The synchronous API also simplifies the SvelteKit server-side code without the complexity of connection pooling.

**Scrypt password hashing** — Passwords are hashed using Node.js's `scryptSync` with a random 16-byte salt per user. Scrypt is memory-hard, making it resistant to brute-force attacks, and the per-user salt prevents rainbow table attacks.

**Equipment-based exercise filtering** — Rather than recommending exercises and hoping the user has the gear, the SQL query uses a `NOT IN` subquery to exclude any exercise that requires equipment the user doesn't own. This ensures every recommended exercise is immediately actionable.

**Age-based exercise safety** — High-impact exercises are tagged with minimum age thresholds (e.g., burpees require age < 60, barbell squats require age < 70). This prevents the app from recommending potentially dangerous activities to older users, making the recommendations more responsible and realistic.

**U.S. Navy body fat formula** — Chosen over BMI alone because it accounts for muscle mass vs. fat mass. The formula uses waist, neck, and hip measurements with logarithmic calculations, providing a more accurate body composition assessment than BMI alone.

**Live BMI preview during registration** — The registration form shows real-time BMI and body fat calculations as the user enters their measurements, giving immediate feedback and reducing errors before submission.

## Setup & Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd Gymventory
npm install

# Start the development server
npm run dev

# Build for production
npm run build
npm run preview
```

The SQLite database (`gymventory.db`) is created automatically on first run with all seed data. No external services or environment variables are required.
