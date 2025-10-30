/**
 * Utility functions for generating and validating invite codes
 */

// Characters to use in invite codes (excluding ambiguous characters like 0, O, I, l, 1)
const CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 5-character invite code
 * Uses uppercase letters and numbers, excluding ambiguous characters
 * @returns A 5-character string (e.g., "ABC23", "XY9ZK")
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARACTERS.length);
    code += CODE_CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Validate that a code matches the expected format
 * @param code The code to validate
 * @returns true if valid, false otherwise
 */
export function isValidInviteCodeFormat(code: string): boolean {
  if (!code || code.length !== 5) {
    return false;
  }

  // Check that all characters are in our allowed set
  return code.split('').every(char => CODE_CHARACTERS.includes(char));
}

/**
 * Normalize a user-entered code to uppercase
 * @param code The code to normalize
 * @returns Uppercase version of the code
 */
export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().trim();
}
