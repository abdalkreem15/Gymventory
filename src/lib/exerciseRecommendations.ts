/**
 * Age-based exercise filtering utility.
 * High-impact / high-intensity exercises are filtered out for older users
 * to provide more realistic and safer workout recommendations.
 */

export interface ExerciseLike {
    id: number;
    name: string;
    target_muscle: string;
    instructions: string | null;
    required_equipment: string;
    is_training_specific: number;
}

/**
 * Exercises that are high-impact or high-intensity and should be
 * filtered out for users at or above the specified minimum age.
 */
const HIGH_IMPACT_EXERCISES: Record<string, number> = {
    'Jump Rope Intervals': 60,
    'Burpee Circuit': 60,
    'Boxer Push-Ups': 60,
    'Treadmill Interval Sprints': 60,
    'Swim Fins Sprint Intervals': 60,
    'Underwater Dolphin Kicks': 60,
    'Boxers Footwork Drills': 65,
    'Kettlebell Swings': 65,
    'Barbell Squat': 70,
    'Barbell Romanian Deadlift': 70,
    'Overhead Barbell Press': 70,
    'Barbell Bench Press': 70,
    'Bent-Over Barbell Row': 70,
    'Barbell Bicep Curl': 70,
    'Tricep Dips': 70,
    'Pull-ups': 70,
    'Kung Fu Horse Stance': 70,
    'Front Kick Drills': 70,
    'Tiger Claw Conditioning': 70,
    'Knee Strikes on Heavy Bag': 70,
    'Heavy Bag Kicking Workout': 70,
    'Kickboxing Pad Drills': 70,
    'Shadow Kickboxing': 70,
    'Heavy Bag Workout': 70,
    'Speed Bag Drills': 70,
    'Shadow Boxing': 70,
    'Freestyle Swim Sprints': 70,
    'Kickboard Leg Drills': 70
};

/**
 * Filter exercises based on the user's age.
 * Exercises that are high-impact or high-intensity for the user's age group
 * are removed from the recommendations.
 *
 * @param exercises - The list of recommended exercises
 * @param age - The user's age (null/undefined means no filtering)
 * @returns Filtered list of exercises safe for the user's age
 */
export function filterExercisesByAge<T extends ExerciseLike>(
    exercises: T[],
    age?: number | null
): T[] {
    // No age provided — no filtering
    if (age === undefined || age === null) {
        return exercises;
    }

    return exercises.filter((exercise) => {
        const minAge = HIGH_IMPACT_EXERCISES[exercise.name];
        // Exercise not in the high-impact list — always allowed
        if (minAge === undefined) {
            return true;
        }
        // User is younger than the minimum age for this exercise — allowed
        return age < minAge;
    });
}
