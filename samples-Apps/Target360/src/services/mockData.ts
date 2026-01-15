import type {
	InvestigationSubject,
	InvestigationCheck,
} from "../types/investigation";

const getSergeiChecks =
	(): InvestigationCheck[] => {
		const now =
			new Date().toISOString();
		return [
			{
				id: "1",
				name: "CBP Watchlist Check",
				agency: "CBP",
				status: "Flagged", // Changed to Flagged based on "Watch List Match" in immigration records
				details:
					"Immigration records for Sergei Volkov (passport 987654321) show an expired B1/B2 visa, previous overstay, and an explicit Watch List Match flag.",
				timestamp: now,
				documentName:
					"WebScrape_ImmigrationRecords",
				documentType: "Text",
			},
			{
				id: "2",
				name: "Border Crossing History Check",
				agency: "CBP",
				status: "Flagged",
				details:
					"CBP-related vessel voyage history for USV-7123 shows a HIGH-risk voyage on 2025-11-12 from Colón, Panama to Brownsville, Texas with a route deviation detected. Sergei Volkov is listed as a deckhand.",
				timestamp: now,
				documentName: "CBP_Data",
				documentType: "Text",
			},
			{
				id: "3",
				name: "ID Authenticity Check",
				agency: "CBP",
				status: "Flagged",
				details:
					"ID Number RU8829914 (Russian passport) appears consistently in crew manifest and criminal records, but immigration records show a different passport number (987654321) with an expired B1/B2 visa.",
				timestamp: now,
				documentName:
					"WebScrape_ImmigrationRecords",
				documentType: "Text",
			},
			{
				id: "4",
				name: "Flight History Check",
				agency: "CBP / DHS",
				status: "Warning", // Changed to Warning/Inconclusive as no specific flight data provided, but overall risk is high
				details:
					"No flight or aviation travel history data is included in the provided API output; suspicious flight patterns cannot be assessed.",
				timestamp: now,
				documentName: "N/A",
				documentType: "N/A",
			},
			{
				id: "5",
				name: "Vessel / Maritime Movement Check",
				agency: "Coast Guard",
				status: "Flagged",
				details:
					"Vessel USV-7123 (Pacific Wind), on which Sergei Volkov serves as deckhand, has a recent HIGH-risk voyage (route deviation) and is crewed by multiple individuals with serious criminal records. Current AIS status indicates drifting.",
				timestamp: now,
				documentName:
					"CBP_Data_Vessel_Info",
				documentType: "Text",
			},
			{
				id: "6",
				name: "Prior Law Enforcement Incident Check",
				agency: "ICE / HSI",
				status: "Flagged",
				details:
					"Criminal records show Sergei Volkov (DOB 1980-12-05, Passport RU8829914) with 2015 fraud and 2018 money-laundering charges, active warrants, and active supervision. Severity 8/10.",
				timestamp: now,
				documentName:
					"WebScrape_CriminalRecords",
				documentType: "Text",
			},
			{
				id: "7",
				name: "Cross-Agency Watchlist / Sanctions Check",
				agency: "Treasury / DHS",
				status: "Flagged",
				details:
					"Legacy intelligence summary (status HIT, riskContribution MEDIUM) indicates prior concern in federal intelligence briefs. Combined with immigration watchlist match.",
				timestamp: now,
				documentName:
					"WebScrape_WatchList",
				documentType: "Text",
			},
			{
				id: "8",
				name: "Known Associates / Network Check",
				agency: "Fusion Center",
				status: "Flagged",
				details:
					"Crew associates on USV-7123 (Carlos Mendoza, Tomas Rivera) have serious criminal histories including smuggling, human trafficking, and drug trafficking, with active warrants/absconded status.",
				timestamp: now,
				documentName:
					"WebScrape_CrewManifest",
				documentType: "Text",
			},
			{
				id: "9",
				name: "Financial Activity Check",
				agency: "FinCEN",
				status: "Flagged",
				details:
					"FINCEN SAR flag is TRUE with a pattern of repeated transfers consistent with structuring. Large value movements noted in Cross-Border transfers ($810,300 total).",
				timestamp: now,
				documentName: "FINCEN_Doc_Data",
				documentType: "Text",
			},
			{
				id: "10",
				name: "Intel Summary Check",
				agency: "DHS I&A",
				status: "Flagged",
				details:
					"Legacy intelligence summaries (FC-2019-27 and FC-2021-11) reference the subject in the context of a logistics facilitation network operating between Mexico and the US southwest border.",
				timestamp: now,
				documentName: "API_IntelReport",
				documentType: "JSON",
			},
		];
	};

const generateChecks = (
	isHighRisk: boolean
): InvestigationCheck[] => {
	const now = new Date().toISOString();

	if (isHighRisk) {
		return getSergeiChecks();
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
				name: "Sergei Volkov",
				dob: "1984-06-12",
				nationality: "Russian",
				passportNumber: "RU8829914",
				riskLevel: "High",
				status: "Completed",
				flaggedChecks: 9,
				totalChecks: 10,
				lastUpdated:
					new Date().toISOString(),
				intelSummary:
					"Multiple independent indicators—serious prior fraud and money-laundering charges, FINCEN-flagged structuring activity, cross-agency watchlist hits, and association with a high-risk vessel and crew—support a HIGH overall risk assessment.",
				checks: generateChecks(true),
				isBulkPull: true,
			},
			{
				id: "SUB-2024-002",
				name: "Ashley Smith",
				dob: "1992-07-22",
				nationality: "USA",
				passportNumber: "A55667788",
				riskLevel: "Low",
				status: "Completed",
				flaggedChecks: 0,
				totalChecks: 10,
				lastUpdated:
					new Date().toISOString(),
				intelSummary:
					"Low-risk individual. Initial watchlist flag determined to be a name collision. All other checks are clear.",
				checks: generateChecks(false),
				isBulkPull: true,
			},
			{
				id: "SUB-2024-003",
				name: "John Smith",
				dob: "1980-01-15",
				nationality: "Canada",
				passportNumber: "C12345678",
				riskLevel: "Medium",
				status: "Analyst Review",
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

export const rawInvestigationData = {
	Target_Name: "Sergei Volkov",
	id_Number: "RU8829914",
	id_Nationality: "Russian",
	id_DOB: "1984-06-12",
	CBP_Data: `Vessel Information    
Field Value   
Vessel ID USV-7123   
Vessel Name Pacific Wind   
MMSI 353278900   
Flag Panama   
Port of Origin ColÃ³n   
Destination Port  Panama   
Departure Date Unknown   
Arrival Date  TX   
Cargo Type Brownsville   
AIS Status 11/23/2025 21:55   
Notes 11/20/2025 10:18   
Current Status Drifting   
    
Crew Manifest    
Crew ID Name Role Nationality 
PA12345678 Carlos Mendoza Captain Panamanian 
PA23456789 TomÃ¡s Rivera Navigator Panamanian 
CA12345678 James Lee Cook Canadian 
987654321 Sergei Volkov Deckhand Russian 
    
Voyage History    
Date Origin Destination Risk Notes
11/12/2025 ColÃ³n PA Brownsville TX High Route deviation detected
10/30/2025 Kingston JM ColÃ³n PA Medium Late departure
`,
	WebScrape_ImmigrationRecords: `First Name Last Name Doc Type Doc Number Visa Type Status Country Purpose Overstay Risk Travel Flags
Sergei Volkov Passport RU8829914 B1/B2 (Business/Tourist) Expired
 Russia Business Conference 8.5 
Visa Expired
Previous Overstay
Watch List Match
Mina Park Passport M12345678 F1 (Student) Valid
 South Korea Graduate Studies 1.2 
None
Ahmed Al-Farsi Passport UAE998877 H1B (Work) Valid
 United Arab Emirates Software Engineering 1.5 
None
Maria Santos Passport BR445566778 B2 (Tourist) Valid
 Brazil Vacation 3.2 
None
Chen Wei Passport CN112233445 L1 (Intracompany Transfer) Pending
 China Executive Transfer 4.0 
Visa Renewal Pending
Missing Documents
Fatima Hassan Passport PK778899001 B1/B2 (Business/Tourist) Revoked
 Pakistan Medical Treatment 7.8 
Visa Revoked
Previous Violation
Yuki Tanaka Passport JP789456123 J1 (Exchange Visitor) Valid
 Japan Research Scholar 0.8 
None
Dmitri Kozlov Passport UA456123789 B1/B2 (Business/Tourist) Expired
 Ukraine Business Meetings 6.2 
Visa Expired
Watch List Match
Lucia Fernandez Passport ES321789654 O1 (Extraordinary Ability) Valid
 Spain Film Production 1.0 
None
Carlos Mendez Passport CO456789123 B1/B2 (Business/Tourist) Revoked
 Colombia Business 9.5 
Visa Revoked
Criminal Record
Watch List Match
Interpol Alert
Hans Mueller Passport DE654987321 E2 (Treaty Investor) Valid
 Germany Business Investment 2.1 
Watch List Match
Olga Petrova Passport RU852963174 F1 (Student) Valid
 Russia PhD Program 2.8 
None
Mohammed Al-Sayed Passport EG987654123 H1B (Work) Valid
 Egypt Medical Residency 1.3 
None
Priya Sharma Passport IN147258369 H4 (Dependent) Valid
 India Accompanying Spouse 1.8 
None
Jean-Pierre Dubois Passport FR963852741 B1/B2 (Business/Tourist) Valid
 France Wine Trade Conference 0.9 
None
Nikolai Sorokin Passport RU741852963 B1/B2 (Business/Tourist) Expired
 Russia Financial Consulting 7.5 
Visa Expired
Watch List Match
Financial Investigation`,
	API_IntelReport: `"legacyIntelSummary": {
      "checkId": 10,
      "checkName": "Legacy Intelligence Summary / Prior Briefs",
      "sourceSystem": "Legacy_Intel_Briefs.pdf",
      "mentionsCount": 2,
      "entries": [
        {
          "briefId": "FC-2019-27",
          "concernLevel": "MEDIUM",
          "summary": "Subject referenced in context of logistics facilitation network operating between MX and US southwest border."
        },
        {
          "briefId": "FC-2021-11",
          "concernLevel": "MEDIUM",
          "summary": "Subject re-appears as recurring name in association matrices; recommended for continued monitoring."
        }
      ],
      "status": "HIT",
      "riskContribution": "MEDIUM"
    }`,
	WebScrape_VesselID: "USV-7123",
	WebScrape_CrewManifest: `Document Type Document No. Name Role Nationality
Passport PA12345678 Carlos Mendoza Captain Panamanian
Passport PA23456789 Tomas Rivera Navigator Panamanian
Passport CA12345678 James Lee Cook Canadian
Passport RU8829914 Sergei Volkov Deckhand Russian`,
	WebScrape_CriminalRecords: `First Name Last Name DOB Doc Type Doc Number Charges Warrants Parole Status Severity Risk
Sergei Volkov 1980-12-05 Passport RU8829914 
2015-03-22
Fraud
2018-09-14
Money Laundering
 YES Active Supervision 8/10 7.2
Mina Park 1995-07-12 Passport M12345678 
None
 No None 0/10 0.5
Luis Ortega 1980-05-18 Passport MX98765432 
None
 No None 0/10 0.3
Sofia Cruz 1992-09-25 Passport MX87654321 
None
 No None 0/10 0.2
Mark Davis 1988-02-14 Passport US56789012 
None
 No None 0/10 0.4
Carlos Mendoza 1978-03-14 Passport PA12345678 
2016-08-22
Smuggling
2019-11-03
Customs Violation
2023-06-15
Human Trafficking
 YES Absconded 9/10 8.8
Tomas Rivera 1985-07-22 Passport PA23456789 
2018-04-11
Drug Trafficking
2021-09-28
Possession with Intent
 YES Absconded 8/10 7.5
James Lee 1990-11-08 Passport CA12345678 
2020-02-14
Smuggling - Contraband
2022-08-30
Falsifying Maritime Documents
 No Active Supervision 6/10 5.2
Marcus Johnson 1982-08-14 Passport US11223344 
2012-11-03
Assault
2017-04-28
Robbery
 No Completed 7/10 6.5
Elena Rodriguez 1990-02-28 Passport US55667788 
2019-07-22
Drug Possession
 No Probation Completed 4/10 3.8
Derek Thompson 1975-05-19 Passport US99001122 
2010-12-05
Embezzlement
2016-03-11
Tax Evasion
 No None 5/10 4.2
Anthony Rizzo 1984-06-17 Passport US33445566 
2014-02-15
Racketeering
2014-02-15
Extortion
 No Active Supervision 8/10 5.8
Jamal Williams 1993-11-02 Passport US77889900 
2016-08-19
Armed Robbery
 No Active Supervision 7/10 4.9
Patricia Gonzalez 1988-03-25 Passport US11224455 
2020-05-11
Identity Theft
2020-05-11
Wire Fraud
 No Probation Active 5/10 3.2
Raymond Chen 1979-09-08 Passport US66778899 
2018-11-22
Securities Fraud
 YES None 6/10 4.5
Dmitri Kozlov 1983-08-30 Passport UA456123789 
2017-04-02
Money Laundering
2019-01-15
Tax Fraud
 No Completed 7/10 5.1
Lisa Marie Turner 1991-12-14 Passport US44556677 
2021-03-08
Check Fraud
 No None 1/10 1.2
Carlos Mendez 1990-07-08 Passport CO456789123 
2015-09-22
Drug Trafficking
2015-09-22
Possession of Firearm
2019-12-01
Conspiracy
 YES Absconded 9/10 8.5
Robert Michael Davis 1970-01-30 Passport US22334455 
2008-06-15
DUI
2012-09-03
DUI
2018-02-28
Vehicular Manslaughter
 No Active Supervision 9/10 6.8
Wei Zhang 1986-09-27 Passport CN147258369 
2020-07-14
Counterfeiting
 No None 4/10 3.0
Sandra K. Mitchell 1985-04-19 Passport US88990011 
2019-10-05
Insurance Fraud
 No Probation Completed 3/10 2.1
`,
	FINCEN_Doc_Data: `
Financial Report Table data:
Name | Summary | Outbound Volume By Week | Value Distributions | Types of Money Transfers
Sergei Volkov | This report reviews Sergei Volkov's financial activity over the past quarter. Overall, the amount of money being sent out week by week showed noticeable ups and downs. Activity increased sharply around the middle of the quarter before stabilizing. The review also found that larger transactions tended to happen in short bursts rather than being spread evenly across the quarter. This kind of pattern can indicate unusual financial behavior and may need closer examination. | Bar chart showing weekly outbound volume with a peak at week 5. | The breakdown of transactions shows that some categories had both a high number of transfers and large total dollar amounts. Cross-Border and Domestic Transfers in particular contained several large-value movements, which may warrant additional review. | Pie chart showing types of money transfers: Cross-Border, Large Transfers, Peer-to-Peer, Bill Payments, Other Outbound.

Transaction Summary Table data:
ID | Number of Transfers | Amount | Category
TX032541 | 58 | 284,100 | Domestic
TX037552 | 145 | 810,300 | Cross-Border
TX034276 | 120 | 195,870 | Online
TX078109 | 140 | 97,500 | Online
TX015619 | 125 | 104,500 | Other
`,
	WebScrape_WatchList: "USV-7123",
};
