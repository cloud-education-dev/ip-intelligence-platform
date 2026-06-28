import { analyzeIPv4, CidrBlock, intToIp, ipToInt, parseCidr } from './ipv4';
import { equalSubnets, supernet, vlsm } from '../subnet/subnetting';

export interface ExplanationStep { title: string; arithmetic: string; simple: string; }

export function ipv4Explanation(ip: string): ExplanationStep[] {
  const a = analyzeIPv4(ip);
  const octets = a.normalized.split('.').map(Number);
  return [
    {
      title: 'Convert dotted IPv4 to one decimal number',
      arithmetic: `${octets[0]} × 256³ + ${octets[1]} × 256² + ${octets[2]} × 256¹ + ${octets[3]} = ${a.decimal}`,
      simple: 'An IPv4 address has 4 boxes. Each box is worth a different place value, just like thousands, hundreds, tens and ones.',
    },
    {
      title: 'Convert each octet to binary',
      arithmetic: `${octets.map((o) => `${o} = ${o.toString(2).padStart(8, '0')}`).join(' | ')}`,
      simple: 'Computers read IP addresses as 1s and 0s. Each IPv4 box becomes 8 binary bits.',
    },
    {
      title: 'Find address class and type',
      arithmetic: `First octet = ${octets[0]} → Class ${a.className}; range check → ${a.addressType}`,
      simple: 'Old network classes look at the first number. Special ranges tell us if the IP is private, public, loopback, multicast or reserved.',
    },
  ];
}

export function cidrExplanation(cidr: string): ExplanationStep[] {
  const c = parseCidr(cidr);
  const ipParts = c.ip.split('.').map(Number);
  const blockSize = 2 ** (32 - c.prefix);
  const interestingOctet = Math.min(3, Math.floor(c.prefix / 8));
  const interestingValue = ipParts[interestingOctet] ?? ipParts[3];
  const subnetStart = Math.floor(interestingValue / blockSize) * blockSize;
  return [
    {
      title: 'Split network bits and host bits',
      arithmetic: `/ ${c.prefix} means network bits = ${c.prefix}, host bits = 32 - ${c.prefix} = ${32 - c.prefix}`,
      simple: 'Network bits identify the street. Host bits identify the house on that street.',
    },
    {
      title: 'Calculate total addresses',
      arithmetic: `2^(host bits) = 2^${32 - c.prefix} = ${c.total}`,
      simple: 'Every host bit can be 0 or 1. That is why we use powers of 2.',
    },
    {
      title: 'Calculate usable addresses',
      arithmetic: c.prefix >= 31 ? `${c.total} usable for /31 or /32 special networks` : `${c.total} - 2 = ${c.usable}`,
      simple: 'Normally the first address is the network address and the last address is broadcast, so hosts cannot use them.',
    },
    {
      title: 'Find network and broadcast address',
      arithmetic: `Block size = ${blockSize}. ${interestingValue} ÷ ${blockSize} = ${Math.floor(interestingValue / blockSize)} remainder ${interestingValue % blockSize}. Network block starts at ${subnetStart}. Network = ${c.network}, Broadcast = ${c.broadcast}`,
      simple: 'CIDR networks move in fixed-size blocks. We find which block the IP belongs to.',
    },
    {
      title: 'Find first host, last host and gateway',
      arithmetic: `First host = ${c.network} + 1 = ${c.firstHost}; Last host = ${c.broadcast} - 1 = ${c.lastHost}; Suggested gateway = ${c.gateway}`,
      simple: 'A common practice is to use the first usable IP as the default gateway.',
    },
  ];
}

export function equalSubnetExplanation(parentCidr: string, count: number): ExplanationStep[] {
  const parent = parseCidr(parentCidr);
  const borrowedBits = Math.ceil(Math.log2(count));
  const newPrefix = parent.prefix + borrowedBits;
  const size = 2 ** (32 - newPrefix);
  return [
    {
      title: 'Find how many bits to borrow',
      arithmetic: `Need ${count} subnets. Borrow bits = ceil(log₂(${count})) = ${borrowedBits}`,
      simple: 'Borrowing host bits creates more smaller networks.',
    },
    {
      title: 'Find new subnet prefix',
      arithmetic: `New prefix = parent prefix + borrowed bits = ${parent.prefix} + ${borrowedBits} = /${newPrefix}`,
      simple: 'A bigger prefix means a smaller subnet.',
    },
    {
      title: 'Find size of every subnet',
      arithmetic: `Addresses per subnet = 2^(32 - ${newPrefix}) = ${size}`,
      simple: 'All equal subnets have the same number of addresses.',
    },
  ];
}

export function vlsmExplanation(parentCidr: string, text: string): ExplanationStep[] {
  const reqs = text.split('\n').map((l) => l.split(',')).filter((x) => x.length === 2).map(([name, h]) => ({ name: name.trim(), hosts: Number(h) }));
  const plan = vlsm(parentCidr, reqs);
  return plan.map((p) => ({
    title: `${p.name}: choose best subnet`,
    arithmetic: `Required hosts = ${p.requiredHosts}. Add network+broadcast = ${p.requiredHosts} + 2 = ${p.requiredHosts + 2}. Next power of 2 = ${p.block.total}. Prefix = /${p.block.prefix}. Waste = ${p.block.usable} - ${p.requiredHosts} = ${p.waste}`,
    simple: 'VLSM gives big departments bigger subnets and small departments smaller subnets, so we waste fewer IP addresses.',
  }));
}

export function supernetExplanation(cidrsText: string): ExplanationStep[] {
  const cidrs = cidrsText.split('\n').filter(Boolean);
  const s = supernet(cidrs);
  const blocks = cidrs.map(parseCidr);
  const min = Math.min(...blocks.map((b) => b.networkInt));
  const max = Math.max(...blocks.map((b) => b.broadcastInt));
  return [
    {
      title: 'Find the lowest and highest address',
      arithmetic: `Lowest network = ${intToIp(min)}; Highest broadcast = ${intToIp(max)}`,
      simple: 'To summarize routes, first find the full address range we must cover.',
    },
    {
      title: 'Find common left-side bits',
      arithmetic: `Common prefix of ${intToIp(min)} and ${intToIp(max)} = /${s.prefix}. Summary route = ${s.cidr}`,
      simple: 'A supernet keeps only the matching left-side bits and turns the rest into host space.',
    },
  ];
}

export function binaryExplanation(value: string): ExplanationStep[] {
  const n = value.includes('.') ? ipToInt(value) : Number(value || 0);
  return [
    {
      title: 'Decimal to binary',
      arithmetic: `${n} = ${n.toString(2)}`,
      simple: 'Binary is base 2. It uses only 0 and 1.',
    },
    {
      title: 'Decimal to hexadecimal',
      arithmetic: `${n} = 0x${n.toString(16).toUpperCase()}`,
      simple: 'Hexadecimal is base 16. It is shorter and easier to read than long binary numbers.',
    },
    {
      title: 'Decimal to octal',
      arithmetic: `${n} = 0o${n.toString(8)}`,
      simple: 'Octal is base 8. It uses digits 0 to 7.',
    },
  ];
}
