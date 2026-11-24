import { describe, expect, it } from 'vitest';
import {
  containsMaliciousPayload,
  isJwtTokenExpired,
  sanitizeMultilineText,
  sanitizePlainText,
  sanitizeSafeImageSrc,
  stripDangerousObjectKeys,
  validateMemberInput,
  validateNewsInput
} from './security';

describe('Dual-layer security & anti-malware sanitizers', () => {
  it('blocks XSS scripts, SVG data URIs, javascript protocols, and inline handlers', () => {
    expect(containsMaliciousPayload('<script>alert(1)</script>')).toBe(true);
    expect(containsMaliciousPayload('javascript:alert(document.cookie)')).toBe(true);
    expect(containsMaliciousPayload('data:image/svg+xml;base64,PHN2Zz4=')).toBe(true);
    expect(containsMaliciousPayload('<img src=x onerror=alert(1)>')).toBe(true);

    expect(sanitizePlainText('<b>Nguyễn</b> <script>evil()</script> Hoàng Anh')).toBe(
      'Nguyễn Hoàng Anh'
    );
    expect(sanitizeMultilineText('Dòng 1\n<iframe src="evil"></iframe>Dòng 2')).toBe(
      'Dòng 1\nDòng 2'
    );
  });

  it('whitelists safe raster images and blocks SVG/traversal/malicious image paths', () => {
    expect(sanitizeSafeImageSrc('news/ra-quan.jpg')).toBe('news/ra-quan.jpg');
    expect(sanitizeSafeImageSrc('../../etc/passwd', 'news/ra-quan.jpg')).toBe('news/ra-quan.jpg');
    expect(sanitizeSafeImageSrc('javascript:alert(1)', 'news/ra-quan.jpg')).toBe('news/ra-quan.jpg');
    expect(sanitizeSafeImageSrc('data:image/svg+xml;base64,AAAA', 'news/ra-quan.jpg')).toBe(
      'news/ra-quan.jpg'
    );
    expect(sanitizeSafeImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo='
    );
  });

  it('strips prototype pollution keys and validates member/news inputs', () => {
    const polluted = JSON.parse('{"maDoanVien":"dn-kp5-050","hoTen":"Lê Văn A","__proto__":{"isAdmin":true}}');
    const clean = stripDangerousObjectKeys(polluted);
    expect(Object.prototype.hasOwnProperty.call(clean, '__proto__')).toBe(false);

    const validMember = validateMemberInput(polluted);
    expect(validMember.maDoanVien).toBe('DN-KP5-050');
    expect(validMember.hoTen).toBe('Lê Văn A');

    expect(() =>
      validateNewsInput({
        title: 'Tin tức <script>hack()</script>',
        summary: 'Tóm tắt hợp lệ cho bản tin Đoàn'
      })
    ).toThrow();
  });

  it('detects expired JWT tokens accurately', () => {
    expect(isJwtTokenExpired('local-session-USR-BT-KP5')).toBe(false);
    expect(isJwtTokenExpired('malformed.token')).toBe(true);
  });
});
