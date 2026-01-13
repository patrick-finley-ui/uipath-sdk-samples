/**
 * Mock Data Configuration
 * Set USE_MOCK_DATA to true to use fake data for development
 * Set to false to use real UiPath data
 */

export const USE_MOCK_DATA = false;

export const MOCK_DATA_CONFIG = {
	// Number of mock investigations to generate
	investigationCount: 47,

	// Pagination
	itemsPerPage: 10,

	// Distribution of risk levels (percentage)
	riskDistribution: {
		high: 0.25,
		medium: 0.35,
		low: 0.4,
	},

	// Distribution of case statuses (percentage)
	statusDistribution: {
		new: 0.2,
		inProgress: 0.5,
		completed: 0.3,
	},
};

// UiPath Entity Configuration
export const ENTITY_CONFIG = {
	entityId:
		"bb0de568-dcec-f011-8d4c-000d3add7f02",
	pageSize: 100,
	orderBy: "UpdateTime desc",
};
