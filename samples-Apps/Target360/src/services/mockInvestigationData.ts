import type {
	InvestigationSubject,
	InvestigationCheck,
	CaseStatus,
} from "../types/investigation";

const generateChecks = (
	isHighRisk: boolean
): InvestigationCheck[] => {
	const now = new Date().toISOString();

	if (isHighRisk) {
		return [
			{
				id: "1",
				name: "CBP Watchlist Check",
				agency: "CBP",
				status: "Flagged",
				details:
					"Match found on Persons of Interest list. Reason: Suspected smuggling ties.",
				timestamp: now,
				documentName:
					"CBP_POE_PersonsOfInterest.csv",
				documentType: "CSV",
			},
			{
				id: "2",
				name: "Border Crossing History",
				agency: "CBP",
				status: "Flagged",
				details:
					"Frequent crossings at high-risk sectors (El Paso, San Ysidro) with short duration stays.",
				timestamp: now,
				documentName:
					"CBP_Crossing_Records.pdf",
				documentType: "PDF",
			},
			{
				id: "3",
				name: "Passport / ID Authenticity",
				agency: "CBP",
				status: "Clear",
				details:
					"Passport appears valid. No signs of tampering.",
				timestamp: now,
				documentName:
					"Passport_Scan.jpg",
				documentType: "Image",
			},
			{
				id: "4",
				name: "Flight History",
				agency: "CBP / DHS",
				status: "Flagged",
				details:
					"Flight patterns consistent with known trafficking routes (Bogota -> Mexico City -> Tijuana).",
				timestamp: now,
				documentName:
					"Intl_Flight_Manifest.csv",
				documentType: "CSV",
			},
			{
				id: "5",
				name: "Vessel / Maritime Movement",
				agency: "Coast Guard",
				status: "Flagged",
				details:
					'Listed as crew member on "La Estrella" - vessel flagged for illicit cargo.',
				timestamp: now,
				documentName:
					"Vessel_Crew_Manifest.pdf",
				documentType: "PDF",
			},
			{
				id: "6",
				name: "Prior Law Enforcement Incident",
				agency: "ICE / HSI",
				status: "Flagged",
				details:
					"Open investigation (Case #HSI-2024-9982) related to bulk cash smuggling.",
				timestamp: now,
				documentName:
					"Incident_Report_HSI.pdf",
				documentType: "PDF",
			},
			{
				id: "7",
				name: "Sanctions Check",
				agency: "Treasury",
				status: "Warning",
				details:
					"Potential name match on OFAC SDN list (low confidence).",
				timestamp: now,
				documentName:
					"Sanctions_Watchlist.json",
				documentType: "JSON",
			},
			{
				id: "8",
				name: "Known Associates",
				agency: "Fusion Center",
				status: "Flagged",
				details:
					'Direct association with known cartel lieutenant "El Gato".',
				timestamp: now,
				documentName:
					"Network_Association_Report.pdf",
				documentType: "PDF",
			},
			{
				id: "9",
				name: "Financial Activity",
				agency: "FinCEN",
				status: "Flagged",
				details:
					"SAR filed: Multiple cash deposits just under $10k reporting threshold.",
				timestamp: now,
				documentName:
					"Suspicious_Activity_Summary.pdf",
				documentType: "PDF",
			},
			{
				id: "10",
				name: "Intel Summary",
				agency: "DHS I&A",
				status: "Flagged",
				details:
					"Subject mentioned in Q3 2024 Intel Brief regarding new smuggling routes.",
				timestamp: now,
				documentName:
					"Intel_Summary_Brief.pdf",
				documentType: "PDF",
			},
		];
	} else {
		return [
			{
				id: "1",
				name: "CBP Watchlist Check",
				agency: "CBP",
				status: "Warning",
				details:
					'Name collision with "Mina Park" (different DOB). Flagged for manual review.',
				timestamp: now,
				documentName:
					"CBP_POE_PersonsOfInterest.csv",
				documentType: "CSV",
			},
			{
				id: "2",
				name: "Border Crossing History",
				agency: "CBP",
				status: "Clear",
				details:
					"Standard tourist travel pattern. 2 crossings in last 5 years.",
				timestamp: now,
				documentName:
					"CBP_Crossing_Records.pdf",
				documentType: "PDF",
			},
			{
				id: "3",
				name: "Passport / ID Authenticity",
				agency: "CBP",
				status: "Clear",
				details:
					"Valid US Passport. Verified via chip read.",
				timestamp: now,
				documentName:
					"Passport_Scan.jpg",
				documentType: "Image",
			},
			{
				id: "4",
				name: "Flight History",
				agency: "CBP / DHS",
				status: "Clear",
				details:
					"Round trip JFK <-> LHR. Family vacation pattern.",
				timestamp: now,
				documentName:
					"Intl_Flight_Manifest.csv",
				documentType: "CSV",
			},
			{
				id: "5",
				name: "Vessel / Maritime Movement",
				agency: "Coast Guard",
				status: "Clear",
				details: "No records found.",
				timestamp: now,
				documentName: "N/A",
				documentType: "N/A",
			},
			{
				id: "6",
				name: "Prior Law Enforcement Incident",
				agency: "ICE / HSI",
				status: "Clear",
				details:
					"No criminal record or prior encounters found.",
				timestamp: now,
				documentName: "N/A",
				documentType: "N/A",
			},
			{
				id: "7",
				name: "Sanctions Check",
				agency: "Treasury",
				status: "Clear",
				details: "No matches found.",
				timestamp: now,
				documentName:
					"Sanctions_Watchlist.json",
				documentType: "JSON",
			},
			{
				id: "8",
				name: "Known Associates",
				agency: "Fusion Center",
				status: "Clear",
				details:
					"No known criminal associations.",
				timestamp: now,
				documentName: "N/A",
				documentType: "N/A",
			},
			{
				id: "9",
				name: "Financial Activity",
				agency: "FinCEN",
				status: "Clear",
				details:
					"No suspicious activity reports (SARs) found.",
				timestamp: now,
				documentName: "N/A",
				documentType: "N/A",
			},
			{
				id: "10",
				name: "Intel Summary",
				agency: "DHS I&A",
				status: "Clear",
				details:
					"No prior intel reports on this subject.",
				timestamp: now,
				documentName: "N/A",
				documentType: "N/A",
			},
		];
	}
};

export const getMockSubjects =
	(): InvestigationSubject[] => {
		return [
			{
				id: "SUB-2024-001",
				name: "Carlos Vega",
				dob: "1985-03-12",
				nationality: "Mexico",
				passportNumber: "M99283741",
				riskLevel: "High",
				status:
					"Completed" as CaseStatus,
				flaggedChecks: 8,
				totalChecks: 10,
				lastUpdated:
					new Date().toISOString(),
				intelSummary:
					"High-risk individual with confirmed ties to organized crime and smuggling operations. Multiple agency flags indicate active involvement in illicit cross-border activities.",
				checks: generateChecks(true),
				isBulkPull: true,
			},
		
			{
				id: "SUB-2024-003",
				name: "John Smith",
				dob: "1980-01-15",
				nationality: "Canada",
				passportNumber: "C12345678",
				riskLevel: "Medium",
				status:
					"Analyst Review" as CaseStatus,
				flaggedChecks: 2,
				totalChecks: 10,
				lastUpdated:
					new Date().toISOString(),
				intelSummary:
					"Pending final review. Some financial irregularities noted.",
				checks: [],
				isBulkPull: false,
			},
		];
	};
