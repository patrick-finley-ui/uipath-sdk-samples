/**
 * List of random applicant names for loan applications
 */
const RANDOM_NAMES = [
  'John Sample',
  'Sarah Johnson',
  'Michael Chen',
  'Emily Davis',
  'Robert Wilson',
  'Jessica Martinez',
  'David Anderson',
  'Amanda Taylor',
  'Christopher Brown',
  'Michelle Garcia',
  'James Rodriguez',
  'Lisa Thompson',
  'Daniel White',
  'Jennifer Harris',
  'Matthew Clark',
  'Nicole Lewis',
  'Andrew Walker',
  'Stephanie Hall',
  'Ryan Young',
  'Lauren King',
  'Kevin Wright',
  'Rachel Lopez',
  'Brian Hill',
  'Ashley Scott',
  'Justin Green',
  'Megan Adams',
  'Brandon Baker',
  'Brittany Gonzalez',
  'Tyler Nelson',
  'Samantha Carter',
];

/**
 * Maps a loan ID to a deterministic random name.
 * The same loan ID will always get the same name.
 */
export function getApplicantName(loanId: string): string {
  // Create a simple hash from the loan ID
  let hash = 0;
  for (let i = 0; i < loanId.length; i++) {
    const char = loanId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % RANDOM_NAMES.length;
  return RANDOM_NAMES[index];
}

/**
 * Gets the list of all available names (for reference)
 */
export function getAllNames(): string[] {
  return [...RANDOM_NAMES];
}
