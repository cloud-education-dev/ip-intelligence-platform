import { describe, expect, it } from 'vitest';
import { lookupRoute, Route } from './routing';

describe('routing domain', () => {
  const routes: Route[] = [
    { id: 'local', destination: '10.20.0.0/16', target: 'local' },
    { id: 'private', destination: '10.0.0.0/8', target: 'tgw-123' },
    { id: 'default', destination: '0.0.0.0/0', target: 'igw-123' }
  ];

  it('matches routes correctly', () => {
    const result = lookupRoute(routes, '10.20.1.1');
    expect(result.route?.id).toBe('local');
    expect(result.reason).toContain('Matched longest prefix');
  });

  it('handles invalid IP inputs gracefully without crashing', () => {
    const resultEmpty = lookupRoute(routes, '');
    expect(resultEmpty.route).toBeUndefined();
    expect(resultEmpty.reason).toContain('Invalid destination IP');

    const resultInvalid = lookupRoute(routes, 'not-an-ip');
    expect(resultInvalid.route).toBeUndefined();
    expect(resultInvalid.reason).toContain('Invalid destination IP');
  });
});
