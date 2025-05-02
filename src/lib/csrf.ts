import crypto from 'crypto';

/**
 * Generate a CSRF token
 * @returns CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify a CSRF token
 * @param token Token to verify
 * @param expectedToken Expected token
 * @returns True if the token is valid
 */
export function verifyCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  try {
    // Ensure both buffers are the same length for timingSafeEqual
    const tokenBuf = Buffer.from(token);
    const expectedTokenBuf = Buffer.from(expectedToken);

    // If lengths are different, return false
    if (tokenBuf.length !== expectedTokenBuf.length) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(tokenBuf, expectedTokenBuf);
  } catch (error) {
    console.error('Error verifying CSRF token:', error);
    return false;
  }
}
