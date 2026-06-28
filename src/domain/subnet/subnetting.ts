import { CidrBlock, intToIp, parseCidr, nextPowerPrefix } from '../ip/ipv4';

export interface SubnetPlan { name: string; requiredHosts: number; block: CidrBlock; waste: number; gateway: string; }

export function equalSubnets(parentCidr: string, count: number): CidrBlock[] {
  const parent = parseCidr(parentCidr);
  const bits = Math.ceil(Math.log2(count));
  const newPrefix = parent.prefix + bits;
  if (newPrefix > 32) throw new Error('Too many subnets for parent CIDR');
  const size = 2 ** (32 - newPrefix);
  return Array.from({ length: count }, (_, i) => parseCidr(`${intToIp(parent.networkInt + i * size)}/${newPrefix}`));
}

export function vlsm(parentCidr: string, requirements: { name: string; hosts: number }[]): SubnetPlan[] {
  const parent = parseCidr(parentCidr);
  let cursor = parent.networkInt;
  return [...requirements].sort((a,b)=>b.hosts-a.hosts).map(req => {
    const prefix = nextPowerPrefix(req.hosts);
    const size = 2 ** (32-prefix);
    const aligned = Math.ceil(cursor / size) * size;
    const block = parseCidr(`${intToIp(aligned)}/${prefix}`);
    if (block.broadcastInt > parent.broadcastInt) throw new Error(`Not enough space for ${req.name}`);
    cursor = block.broadcastInt + 1;
    return { name: req.name, requiredHosts: req.hosts, block, gateway: block.gateway, waste: Math.max(block.usable - req.hosts, 0) };
  });
}

export function supernet(cidrs: string[]): CidrBlock {
  if (cidrs.length === 0) throw new Error('At least one CIDR is required');
  const blocks = cidrs.map(parseCidr).sort((a,b)=>a.networkInt-b.networkInt);
  const min = blocks[0].networkInt >>> 0;
  const max = blocks.reduce((m,b)=>Math.max(m,b.broadcastInt), blocks[0].broadcastInt) >>> 0;
  const xor = (min ^ max) >>> 0;
  const prefix = xor === 0 ? 32 : 31 - Math.floor(Math.log2(xor));
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return parseCidr(`${intToIp((min & mask) >>> 0)}/${prefix}`);
}
