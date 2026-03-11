import type {
	Investigation,
	InvestigationKPIs,
	RiskLevel,
	CaseStatus,
	DataSource,
} from "../types/investigation";

const names = [

	{
		first: "Maria",
		last: "Hassan",
		nationality: "Lebanese",
	},
	{
		first: "Ashley",
		last: "Smith",
		nationality: "American",
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

const intelSummaries = {
	high: [
		"Multiple sanctions hits, PEP connection confirmed, adverse media findings",
		"Report Required - Multiple sanctions matches detected",
		"Known associate of designated entities, financial irregularities",
		"Active OFAC match, ongoing investigation required",
		"PEP status confirmed, corruption allegations in local media",
		"Sanctions hit on family member, business ties to restricted entities",
		"Multiple watchlist matches across agencies",
		"High-value target, organized crime connections suspected",
	],
	medium: [
		"Potential PEP relative match, business ties need review",
		"Minor adverse media mentions, requires further investigation",
		"Watchlist match - low confidence, manual review needed",
		"Financial transaction patterns warrant attention",
		"Historical sanctions cleared, but new entities flagged",
		"Business partner has PEP connections",
		"Address matches known risk location",
	],
	low: [
		"No adverse findings, clean background check",
		"Cleared - No adverse findings identified",
		"All checks passed, low risk profile",
		"Standard screening complete, no flags",
		"Minor name similarity resolved, no true match",
		"Routine check complete, proceed with approval",
		"Clean record, no sanctions or PEP ties",
	],
};

const getRandomElement = <T>(
	array: T[]
): T => {
	return array[
		Math.floor(
			Math.random() * array.length
		)
	];
};

const getRandomDate = (
	daysAgo: number
): string => {
	const date = new Date();
	date.setDate(
		date.getDate() -
			Math.floor(
				Math.random() * daysAgo
			)
	);
	return date.toISOString();
};

const getRandomDOB = (): string => {
	const year =
		1950 +
		Math.floor(Math.random() * 55);
	const month = String(
		Math.floor(Math.random() * 12) + 1
	).padStart(2, "0");
	const day = String(
		Math.floor(Math.random() * 28) + 1
	).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const getRiskDrivers = (
	risk: RiskLevel
): DataSource[] => {
	const allDrivers: DataSource[] = [
		"Sanctions",
		"PEP",
		"Adverse Media",
		"Watchlists",
		"Financial",
		"Criminal Records",
	];

	if (risk === "High") {
		return allDrivers.slice(
			0,
			2 + Math.floor(Math.random() * 3)
		);
	} else if (risk === "Medium") {
		return allDrivers.slice(
			0,
			1 + Math.floor(Math.random() * 2)
		);
	}
	return [];
};

const getTimeAgo = (
	date: string
): string => {
	const now = new Date();
	const past = new Date(date);
	const diffMs =
		now.getTime() - past.getTime();
	const diffMins = Math.floor(
		diffMs / 60000
	);
	const diffHours = Math.floor(
		diffMs / 3600000
	);
	const diffDays = Math.floor(
		diffMs / 86400000
	);

	if (diffMins < 60)
		return `${diffMins} mins ago`;
	if (diffHours < 24)
		return `${diffHours} hour${
			diffHours > 1 ? "s" : ""
		} ago`;
	return `${diffDays} day${
		diffDays > 1 ? "s" : ""
	} ago`;
};

export const generateMockInvestigations =
	(
		count: number = 47
	): Investigation[] => {
		const investigations: Investigation[] =
			[];

		for (let i = 0; i < count; i++) {
			const name =
				getRandomElement(names);
			const riskRand = Math.random();
			const risk: RiskLevel =
				riskRand < 0.25
					? "High"
					: riskRand < 0.6
					? "Medium"
					: "Low";
			const statusRand = Math.random();
			const status: CaseStatus =
				statusRand < 0.2
					? "New"
					: statusRand < 0.5
					? "AI Agent Review"
					: statusRand < 0.8
					? "Analyst Review"
					: "Completed";

			const totalChecks = 10;
			let flaggedChecks = 0;
			if (risk === "High")
				flaggedChecks =
					7 +
					Math.floor(Math.random() * 3);
			else if (risk === "Medium")
				flaggedChecks =
					3 +
					Math.floor(Math.random() * 3);
			else
				flaggedChecks = Math.floor(
					Math.random() * 2
				);

			const lastActivity =
				getRandomDate(30);
			const needsAttention =
				risk === "High" &&
				status !== "Completed";

			investigations.push({
				id: `INV-2024-${String(
					i + 1
				).padStart(3, "0")}`,
				subjectId: `SUB-2024-${String(
					i + 1
				).padStart(3, "0")}`,
				subjectName: `${name.first} ${name.last}`,
				subjectNationality:
					name.nationality,
				subjectDob: getRandomDOB(),
				overallRisk: risk,
				caseStatus: status,
				flaggedChecks,
				totalChecks,
				primaryRiskDrivers:
					getRiskDrivers(risk),
				intelSummary: getRandomElement(
					intelSummaries[
						risk.toLowerCase() as keyof typeof intelSummaries
					]
				),
				lastActivity,
				decisionState:
					status === "Completed"
						? "Finalized"
						: "Pending",
				needsAttention,
			});
		}

		return investigations.sort(
			(a, b) =>
				new Date(
					b.lastActivity
				).getTime() -
				new Date(
					a.lastActivity
				).getTime()
		);
	};

export const calculateKPIs = (
	investigations: Investigation[]
): InvestigationKPIs => {
	const now = new Date();
	const todayStart = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate()
	);

	return {
		activeCases: investigations.filter(
			(inv) =>
				inv.caseStatus !== "Completed"
		).length,
		highRiskSubjects:
			investigations.filter(
				(inv) =>
					inv.overallRisk === "High"
			).length,
		casesRequiringReview:
			investigations.filter(
				(inv) => inv.needsAttention
			).length,
		completedToday:
			investigations.filter(
				(inv) =>
					inv.caseStatus ===
						"Completed" &&
					new Date(inv.lastActivity) >=
						todayStart
			).length,
		overrides:
			Math.floor(Math.random() * 5) + 1,
	};
};

export const formatTimeAgo = (
	dateString: string
): string => {
	return getTimeAgo(dateString);
};
