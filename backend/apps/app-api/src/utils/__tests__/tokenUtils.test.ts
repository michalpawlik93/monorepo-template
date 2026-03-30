import { extractBearerToken } from '../tokenUtils';

describe('tokenUtils', () => {
  it('extracts token from valid Bearer header', () => {
    const token = extractBearerToken({
      headers: { authorization: 'Bearer token-123' },
    } as never);

    expect(token).toBe('token-123');
  });

  it('returns null when authorization header is missing', () => {
    const token = extractBearerToken({
      headers: {},
    } as never);

    expect(token).toBeNull();
  });

  it('returns null when header does not use Bearer prefix', () => {
    const token = extractBearerToken({
      headers: { authorization: 'token-123' },
    } as never);

    expect(token).toBeNull();
  });

  it('supports array header value and uses first entry', () => {
    const token = extractBearerToken({
      headers: {
        authorization: ['Bearer token-from-array', 'Bearer token-2'],
      },
    } as never);

    expect(token).toBe('token-from-array');
  });

  it('returns null for empty header value', () => {
    const token = extractBearerToken({
      headers: { authorization: '' },
    } as never);

    expect(token).toBeNull();
  });

  it('returns null for whitespace-only token', () => {
    const token = extractBearerToken({
      headers: { authorization: 'Bearer    ' },
    } as never);

    expect(token).toBeNull();
  });
});
