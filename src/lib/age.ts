/**
 * Convert a DD/MM/YYYY date string to YYYY-MM-DD format.
 * Returns null if the input is not a valid DD/MM/YYYY date.
 *
 * @param dateStr - Date in DD/MM/YYYY format
 * @returns Date in YYYY-MM-DD format, or null if invalid
 */
export function parseDMY(dateStr: string): string | null {
	const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
	if (!match) return null;

	const day = Number(match[1]);
	const month = Number(match[2]);
	const year = Number(match[3]);

	if (month < 1 || month > 12) return null;
	if (day < 1 || day > 31) return null;

	// Validate the date is a real calendar date
	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return null;
	}

	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Parse a date input that can be in either DD/MM/YYYY or YYYY-MM-DD format.
 * Returns the date in YYYY-MM-DD format, or null if invalid.
 *
 * @param dateStr - Date in DD/MM/YYYY or YYYY-MM-DD format
 * @returns Date in YYYY-MM-DD format, or null if invalid
 */
export function parseDateInput(dateStr: string): string | null {
	const trimmed = dateStr.trim();

	// If it's already in YYYY-MM-DD format (from native date input), validate it
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		const [year, month, day] = trimmed.split('-').map(Number);
		if (month < 1 || month > 12) return null;
		if (day < 1 || day > 31) return null;

		// Validate the date is a real calendar date
		const date = new Date(year, month - 1, day);
		if (
			date.getFullYear() !== year ||
			date.getMonth() !== month - 1 ||
			date.getDate() !== day
		) {
			return null;
		}

		return trimmed;
	}

	// Otherwise try DD/MM/YYYY format
	return parseDMY(trimmed);
}

/**
 * Convert a YYYY-MM-DD date string to DD/MM/YYYY format.
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Date in DD/MM/YYYY format
 */
export function formatDMY(dateStr: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
	if (!match) return dateStr;
	return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Calculate a person's age in years from their birth date.
 * Handles birthdays correctly (age increments only after the birthday passes).
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @returns Age in whole years
 */
export function calculateAge(birthDate: string): number {
	const today = new Date();
	const birth = new Date(birthDate);

	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();

	// If the birthday hasn't occurred yet this year, subtract one
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}

	return age;
}

/**
 * Validate a birth date string.
 * Ensures it's a real calendar date, not in the future, and the person is at least 13.
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @returns True if the birth date is valid
 */
export function isValidBirthDate(birthDate: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;

	const birth = new Date(birthDate);
	if (isNaN(birth.getTime())) return false;

	// Reject future dates
	if (birth > new Date()) return false;

	// Reject dates before 1900 (age would exceed 120)
	if (birth.getFullYear() < 1900) return false;

	return true;
}