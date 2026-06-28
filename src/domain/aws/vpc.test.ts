import { describe, expect, it } from 'vitest';
import { awsUsableIps } from './vpc';

describe('aws vpc domain', () => {
  it('calculates usable IPs correctly', () => {
    expect(awsUsableIps('10.0.0.0/24')).toBe(251);
  });

  it('handles invalid CIDRs without throwing errors', () => {
    expect(awsUsableIps('')).toBe(0);
    expect(awsUsableIps('invalid')).toBe(0);
  });
});
