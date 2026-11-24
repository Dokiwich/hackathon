import { describe, it, expect } from 'vitest';
import { createDynamicQrSession, encodeQrSessionPayload, verifyDynamicQrCode } from './qrToken';

describe('dynamic QR attendance token lifecycle', () => {
  it('accepts valid dynamic token within TTL and rejects tampered or expired codes', () => {
    const start = 1700000000000;
    const session = createDynamicQrSession('HD-01', 45, start);

    expect(session.code).toHaveLength(6);
    expect(encodeQrSessionPayload(session)).toContain('CHI_DOAN_CHECKIN_V1');

    const ok = verifyDynamicQrCode(session.code, session, start + 10_000);
    expect(ok.valid).toBe(true);

    const wrong = verifyDynamicQrCode('ZZZZZZ', session, start + 10_000);
    expect(wrong.valid).toBe(false);

    const expired = verifyDynamicQrCode(session.code, session, start + 46_000);
    expect(expired.valid).toBe(false);
    expect(expired.reason).toContain('45 giây');
  });
});
