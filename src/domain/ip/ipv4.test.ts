import { describe, expect, it } from 'vitest';
import { analyzeIPv4, parseCidr, ipToInt, intToIp } from './ipv4';
describe('ipv4 domain',()=>{
  it('roundtrips IPv4 integer conversion',()=>{ expect(intToIp(ipToInt('192.168.10.20'))).toBe('192.168.10.20'); });
  it('classifies private RFC1918',()=>{ expect(analyzeIPv4('10.1.2.3').addressType).toBe('private'); });
  it('calculates /27 network',()=>{ const c=parseCidr('192.168.10.20/27'); expect(c.network).toBe('192.168.10.0'); expect(c.broadcast).toBe('192.168.10.31'); expect(c.usable).toBe(30); });
});
