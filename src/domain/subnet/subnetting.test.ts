import { describe, expect, it } from 'vitest';
import { equalSubnets, supernet, vlsm } from './subnetting';
describe('subnetting',()=>{
  it('creates four /26s from /24',()=>{ expect(equalSubnets('10.0.0.0/24',4).map(s=>s.cidr)).toEqual(['10.0.0.0/26','10.0.0.64/26','10.0.0.128/26','10.0.0.192/26']); });
  it('allocates VLSM largest first',()=>{ expect(vlsm('10.0.0.0/24',[{name:'a',hosts:100},{name:'b',hosts:20}])[0].block.prefix).toBe(25); });
  it('summarizes adjacent /24s',()=>{ expect(supernet(['10.0.0.0/24','10.0.1.0/24']).cidr).toBe('10.0.0.0/23'); });
});
