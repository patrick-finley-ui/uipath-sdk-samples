/**
 * List of random claimant names for personal injury claims
 */
const RANDOM_NAMES = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'Robert Wilson',
  'Jessica Martinez',
  'David Anderson',
  'Amanda Taylor',
  'Christopher Lee',
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
  'Thomas Moore',
  'Olivia Jackson',
  'William Martin',
  'Sophia Lee',
  'Joseph Thompson',
  'Isabella Garcia',
  'Richard Martinez',
  'Emma Davis',
];

/**
 * Maps a claim ID to a deterministic random name.
 * The same claim ID will always get the same name.
 */
export function getClaimantName(claimId: string): string {
  // Create a simple hash from the claim ID
  let hash = 0;
  for (let i = 0; i < claimId.length; i++) {
    const char = claimId.charCodeAt(i);
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
