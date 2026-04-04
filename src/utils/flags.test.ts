import { describe, it, expect } from 'vitest';
import { getCountryCode, getFlagClass } from './flags';

describe('getCountryCode', () => {
  it('maps FIFA codes to ISO correctly', () => {
    expect(getCountryCode('ARG')).toBe('ar');
    expect(getCountryCode('BRA')).toBe('br');
    expect(getCountryCode('COL')).toBe('co');
    expect(getCountryCode('ENG')).toBe('gb-eng');
    expect(getCountryCode('SCO')).toBe('gb-sct');
    expect(getCountryCode('USA')).toBe('us');
    expect(getCountryCode('MEX')).toBe('mx');
  });

  it('returns null for unknown codes', () => {
    expect(getCountryCode('XYZ')).toBeNull();
    expect(getCountryCode('')).toBeNull();
    expect(getCountryCode(null)).toBeNull();
  });
});

describe('getFlagClass', () => {
  it('returns correct CSS class', () => {
    expect(getFlagClass('ARG')).toBe('fi fis fi-ar');
    expect(getFlagClass('COL')).toBe('fi fis fi-co');
  });

  it('returns empty string for unknown', () => {
    expect(getFlagClass(null)).toBe('');
    expect(getFlagClass('XYZ')).toBe('');
  });
});
