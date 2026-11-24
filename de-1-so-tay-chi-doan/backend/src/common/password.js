import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

/**
 * Hash a plaintext password with a random or deterministic salt using scrypt.
 * Format: scrypt$<saltHex>$<derivedHex>
 */
export function hashPassword(plain, fixedSaltHex = '') {
  const saltHex = fixedSaltHex ? String(fixedSaltHex) : randomBytes(16).toString('hex');
  const derivedHex = scryptSync(String(plain), saltHex, KEYLEN).toString('hex');
  return `scrypt$${saltHex}$${derivedHex}`;
}

/**
 * Constant-time verification of plaintext password against a stored scrypt hash.
 */
export function verifyPassword(plain, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, saltHex, hashHex] = parts;
  if (!saltHex || !hashHex) {
    return false;
  }
  try {
    const derived = scryptSync(String(plain), saltHex, KEYLEN);
    const expected = Buffer.from(hashHex, 'hex');
    if (derived.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
