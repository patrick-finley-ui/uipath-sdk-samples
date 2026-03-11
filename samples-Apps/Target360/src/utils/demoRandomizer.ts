import type {
	TargetInvestigationEntity,
	RiskLevel,
} from "../types/investigation";

// Name pool (matching mockInvestigations.ts)
const DEMO_NAMES = [
	{
		first: "Vladimir",
		last: "Ivanov",
		nationality: "Russian",
	},
	{
		first: "Maria",
		last: "Hassan",
		nationality: "Lebanese",
	},

	{
		first: "John",
		last: "Smith",
		nationality: "American",
	},
	{
		first: "Raj",
		last: "Kumar",
		nationality: "Indian",
	},
	{
		first: "Dmitri",
		last: "Morozov",
		nationality: "Ukrainian",
	},
	{
		first: "Chen",
		last: "Wei",
		nationality: "Chinese",
	},
	{
		first: "Ahmed",
		last: "Al-Mansour",
		nationality: "Saudi",
	},
	{
		first: "Isabella",
		last: "Rodriguez",
		nationality: "Mexican",
	},
	{
		first: "Viktor",
		last: "Petrov",
		nationality: "Russian",
	},
	{
		first: "Fatima",
		last: "Nasser",
		nationality: "Egyptian",
	},
	{
		first: "Hans",
		last: "Mueller",
		nationality: "German",
	},
	{
		first: "Yuki",
		last: "Tanaka",
		nationality: "Japanese",
	},
	{
		first: "Pierre",
		last: "Dubois",
		nationality: "French",
	},
	{
		first: "Sofia",
		last: "Costa",
		nationality: "Brazilian",
	},
	{
		first: "Ivan",
		last: "Sokolov",
		nationality: "Russian",
	},
	{
		first: "Aisha",
		last: "Mohammed",
		nationality: "Somali",
	},
	{
		first: "Marco",
		last: "Rossi",
		nationality: "Italian",
	},
	{
		first: "Olga",
		last: "Ivanova",
		nationality: "Russian",
	},
	{
		first: "Carlos",
		last: "Mendoza",
		nationality: "Colombian",
	},
];

// // Extended nationality pool
// const NATIONALITIES = [
// 	"Russian",
// 	"Lebanese",
// 	"Korean",
// 	"American",
// 	"Indian",
// 	"Ukrainian",
// 	"Chinese",
// 	"Saudi",
// 	"Mexican",
// 	"Egyptian",
// 	"German",
// 	"Japanese",
// 	"French",
// 	"Brazilian",
// 	"Somali",
// 	"Italian",
// 	"Colombian",
// 	"Nigerian",
// 	"Turkish",
// 	"Pakistani",
// ];

// Risk levels with distribution weights
const RISK_LEVELS: RiskLevel[] = [
	"High",
	"Medium",
	"Low",
];
const RISK_WEIGHTS = [0.25, 0.35, 0.4]; // 25% High, 35% Medium, 40% Low

/**
 * Seeded random number generator for deterministic randomization
 * Same seed (record ID) = same random values across refreshes
 * @param seed - String to use as seed (typically record ID)
 * @returns Random number between 0 and 1
 */
function seededRandom(
	seed: string
): number {
	let hash = 0;
	for (
		let i = 0;
		i < seed.length;
		i++
	) {
		const char = seed.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	// Simple LCG algorithm
	const x = Math.sin(hash) * 10000;
	return x - Math.floor(x);
}

/**
 * Generate deterministic random index for array selection
 * @param seed - String to use as seed
 * @param arrayLength - Length of array to select from
 * @param offset - Optional offset to generate different values from same seed
 * @returns Index within array bounds
 */
function getSeededIndex(
	seed: string,
	arrayLength: number,
	offset: number = 0
): number {
	const combinedSeed =
		seed + offset.toString();
	return Math.floor(
		seededRandom(combinedSeed) *
			arrayLength
	);
}

/**
 * Select random name deterministically based on record ID
 * @param recordId - Unique record identifier
 * @returns Name object with first, last, and nationality
 */
function getRandomName(
	recordId: string
): {
	first: string;
	last: string;
	nationality: string;
} {
	const index = getSeededIndex(
		recordId,
		DEMO_NAMES.length
	);
	return DEMO_NAMES[index];
}

/**
 * Select random nationality deterministically
 * Uses offset to ensure different value from name selection
 * @param recordId - Unique record identifier
 * @returns Nationality string
 */
// function getRandomNationality(
// 	recordId: string
// ): string {
// 	const index = getSeededIndex(
// 		recordId,
// 		NATIONALITIES.length,
// 		1
// 	);
// 	return NATIONALITIES[index];
// }

/**
 * Select random risk level with realistic distribution
 * @param recordId - Unique record identifier
 * @returns Risk level (High/Medium/Low)
 */
function getRandomRiskLevel(
	recordId: string
): RiskLevel {
	const random = seededRandom(
		recordId + "risk"
	);
	let cumulative = 0;
	for (
		let i = 0;
		i < RISK_LEVELS.length;
		i++
	) {
		cumulative += RISK_WEIGHTS[i];
		if (random <= cumulative) {
			return RISK_LEVELS[i];
		}
	}
	return "Low"; // Fallback
}

/**
 * Get flagged checks count correlated with risk level
 * @param recordId - Unique record identifier
 * @param risk - Risk level to correlate with
 * @returns Number of flagged checks (High: 7-9, Medium: 3-5, Low: 0-1)
 */
function getFlaggedChecks(
	recordId: string,
	risk: RiskLevel
): number {
	const random = seededRandom(
		recordId + "checks"
	);
	if (risk === "High") {
		return 7 + Math.floor(random * 3); // 7-9
	} else if (risk === "Medium") {
		return 3 + Math.floor(random * 3); // 3-5
	} else {
		return Math.floor(random * 2); // 0-1
	}
}

/**
 * Generate random date of birth
 * @param recordId - Unique record identifier
 * @returns DOB string in MM/DD/YYYY format (ages 25-65)
 */
function getRandomDOB(
	recordId: string
): string {
	const random = seededRandom(
		recordId + "dob"
	);

	// Generate ages between 25 and 65 years old
	const currentYear =
		new Date().getFullYear();
	const age =
		25 + Math.floor(random * 41); // 25-65
	const birthYear = currentYear - age;

	// Random month (1-12)
	const monthRandom = seededRandom(
		recordId + "month"
	);
	const month =
		1 + Math.floor(monthRandom * 12);

	// Random day (1-28 to keep it simple and avoid invalid dates)
	const dayRandom = seededRandom(
		recordId + "day"
	);
	const day =
		1 + Math.floor(dayRandom * 28);

	// Format as MM/DD/YYYY
	return `${month
		.toString()
		.padStart(2, "0")}/${day
		.toString()
		.padStart(2, "0")}/${birthYear}`;
}

/**
 * Generate random subject ID (passport/government ID format)
 * @param recordId - Unique record identifier
 * @returns Subject ID string (format: XX1234567 - 2 letters + 7 digits)
 */
function getRandomSubjectId(
	recordId: string
): string {
	const random1 = seededRandom(
		recordId + "subjectid1"
	);
	const random2 = seededRandom(
		recordId + "subjectid2"
	);
	const random3 = seededRandom(
		recordId + "subjectid3"
	);

	// Generate 2 random letters
	const letters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const letter1 =
		letters[Math.floor(random1 * 26)];
	const letter2 =
		letters[Math.floor(random2 * 26)];

	// Generate 7 random digits
	const digits = Math.floor(
		random3 * 10000000
	)
		.toString()
		.padStart(7, "0");

	return `${letter1}${letter2}${digits}`;
}

/**
 * Check if entity timestamp is before demo reset time
 * @param entity - Entity record from Data Service
 * @param demoResetTime - ISO timestamp string for reset cutoff
 * @returns true if entity should be randomized, false otherwise
 */
export function shouldRandomize(
	entity: TargetInvestigationEntity,
	demoResetTime: string | null
): boolean {
	if (!demoResetTime) return false;

	// Use UpdateTime, fallback to CreateTime
	const entityTime =
		entity.UpdateTime ||
		entity.CreateTime;
	if (!entityTime) return false; // If no timestamp, don't randomize (safe default)

	return (
		new Date(entityTime) <
		new Date(demoResetTime)
	);
}

/**
 * Apply randomization to entity fields (creates new object, non-mutating)
 * Randomizes: subjectName, subjectNationality, subjectId, subjectDob, risk, numChecksFlagged
 * Preserves: All other entity fields
 * @param entity - Original entity from Data Service
 * @param demoResetTime - ISO timestamp string for reset cutoff
 * @returns New entity with randomized fields or original data with isRandomized flag
 */
export function randomizeEntity(
	entity: TargetInvestigationEntity,
	demoResetTime: string | null
): TargetInvestigationEntity & {
	isRandomized?: boolean;
} {
	if (
		!shouldRandomize(
			entity,
			demoResetTime
		)
	) {
		return {
			...entity,
			isRandomized: false,
		};
	}

	const recordId =
		entity.Id || "unknown";
	const name = getRandomName(recordId);
	const risk =
		getRandomRiskLevel(recordId);

	const flaggedChecks =
		getFlaggedChecks(recordId, risk);
	const dob = getRandomDOB(recordId);
	const subjectId =
		getRandomSubjectId(recordId);

	return {
		...entity, // Keep all original fields
		// Override specific fields for demo
		subjectName: `${name.first} ${name.last}`,
		subjectFirstName: name.first,
		subjectLastName: name.last,
		subjectNationality:
			name.nationality,
		subjectId: subjectId,
		idDOB: dob, // Use entity field name 'idDOB'
		risk: risk,
		numChecksFlagged: flaggedChecks,
		isRandomized: true, // Flag for UI indicators
	};
}
