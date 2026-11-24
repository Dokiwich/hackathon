import { createHmac, timingSafeEqual } from 'node:crypto';

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signHs256Jwt(payload, secret, ttlSeconds = 3600) {
  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + ttlSeconds
  };
  const headerPart = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadPart = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const sig = createHmac('sha256', secret).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

export function verifyHs256Jwt(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, sigPart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSig = base64UrlEncode(createHmac('sha256', secret).update(signingInput).digest());

  const sigBuf = Buffer.from(sigPart);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payloadPart));
    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
