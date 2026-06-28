export type IPv4RangeType =
  | 'private' | 'loopback' | 'multicast' | 'broadcast' | 'documentation' | 'carrier-grade-nat'
  | 'link-local' | 'reserved' | 'this-network' | 'public' | 'benchmark' | 'unspecified';

export interface IPv4Analysis {
  input: string;
  normalized: string;
  decimal: number;
  binary: string;
  hexadecimal: string;
  octal: string;
  thirtyTwoBit: string;
  className: 'A' | 'B' | 'C' | 'D' | 'E';
  addressType: IPv4RangeType;
  isPrivate: boolean;
  isPublic: boolean;
  rfc: string;
  reservedStatus: string;
  usableStatus: string;
}

export interface CidrBlock {
  cidr: string;
  ip: string;
  prefix: number;
  networkInt: number;
  broadcastInt: number;
  maskInt: number;
  wildcardInt: number;
  total: number;
  usable: number;
  firstHost: string;
  lastHost: string;
  gateway: string;
  network: string;
  broadcast: string;
  subnetMask: string;
  wildcardMask: string;
  hostMask: string;
  binaryNetwork: string;
  hexNetwork: string;
  bitBoundary: string;
}

const ranges: { start: number; end: number; type: IPv4RangeType; rfc: string; usable: string }[] = [
  { start: ipToInt('0.0.0.0'), end: ipToInt('0.255.255.255'), type: 'this-network', rfc: 'RFC 1122', usable: 'Not host-assignable except 0.0.0.0 as unspecified source' },
  { start: ipToInt('10.0.0.0'), end: ipToInt('10.255.255.255'), type: 'private', rfc: 'RFC 1918', usable: 'Usable inside private networks' },
  { start: ipToInt('100.64.0.0'), end: ipToInt('100.127.255.255'), type: 'carrier-grade-nat', rfc: 'RFC 6598', usable: 'Provider NAT/shared address space' },
  { start: ipToInt('127.0.0.0'), end: ipToInt('127.255.255.255'), type: 'loopback', rfc: 'RFC 1122', usable: 'Local host loopback only' },
  { start: ipToInt('169.254.0.0'), end: ipToInt('169.254.255.255'), type: 'link-local', rfc: 'RFC 3927', usable: 'Link-local only, not routed' },
  { start: ipToInt('172.16.0.0'), end: ipToInt('172.31.255.255'), type: 'private', rfc: 'RFC 1918', usable: 'Usable inside private networks' },
  { start: ipToInt('192.0.2.0'), end: ipToInt('192.0.2.255'), type: 'documentation', rfc: 'RFC 5737 TEST-NET-1', usable: 'Documentation/examples only' },
  { start: ipToInt('192.168.0.0'), end: ipToInt('192.168.255.255'), type: 'private', rfc: 'RFC 1918', usable: 'Usable inside private networks' },
  { start: ipToInt('198.18.0.0'), end: ipToInt('198.19.255.255'), type: 'benchmark', rfc: 'RFC 2544', usable: 'Benchmark testing only' },
  { start: ipToInt('198.51.100.0'), end: ipToInt('198.51.100.255'), type: 'documentation', rfc: 'RFC 5737 TEST-NET-2', usable: 'Documentation/examples only' },
  { start: ipToInt('203.0.113.0'), end: ipToInt('203.0.113.255'), type: 'documentation', rfc: 'RFC 5737 TEST-NET-3', usable: 'Documentation/examples only' },
  { start: ipToInt('224.0.0.0'), end: ipToInt('239.255.255.255'), type: 'multicast', rfc: 'RFC 5771', usable: 'Multicast group addresses, not unicast hosts' },
  { start: ipToInt('240.0.0.0'), end: ipToInt('255.255.255.254'), type: 'reserved', rfc: 'RFC 1112 / IANA reserved', usable: 'Reserved/future use' },
  { start: ipToInt('255.255.255.255'), end: ipToInt('255.255.255.255'), type: 'broadcast', rfc: 'RFC 919/RFC 922', usable: 'Limited broadcast, not host-assignable' },
];

export function ipToInt(ip: string): number {
  const octets = ip.trim().split('.');
  if (octets.length !== 4) throw new Error('IPv4 must contain four octets');
  return octets.reduce((acc, part) => {
    if (!/^\d+$/.test(part)) throw new Error('IPv4 octets must be decimal numbers');
    const n = Number(part);
    if (n < 0 || n > 255) throw new Error('IPv4 octet outside 0-255');
    return ((acc << 8) >>> 0) + n;
  }, 0) >>> 0;
}

export function intToIp(value: number): string {
  const n = value >>> 0;
  return [24, 16, 8, 0].map((shift) => String((n >>> shift) & 255)).join('.');
}

export function analyzeIPv4(input: string): IPv4Analysis {
  const decimal = ipToInt(input);
  const normalized = intToIp(decimal);
  const first = Number(normalized.split('.')[0]);
  const className = first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D' : 'E';
  const range = ranges.find((r) => decimal >= r.start && decimal <= r.end);
  const addressType = range?.type ?? 'public';
  const binary = decimal.toString(2).padStart(32, '0');
  return {
    input,
    normalized,
    decimal,
    binary,
    hexadecimal: '0x' + decimal.toString(16).toUpperCase().padStart(8, '0'),
    octal: '0o' + decimal.toString(8).padStart(11, '0'),
    thirtyTwoBit: binary.match(/.{1,8}/g)!.join('.'),
    className,
    addressType,
    isPrivate: addressType === 'private',
    isPublic: addressType === 'public',
    rfc: range?.rfc ?? 'Globally routable unicast allocation, IANA/RIR managed',
    reservedStatus: addressType === 'public' || addressType === 'private' ? 'Not reserved' : 'Reserved/special-use',
    usableStatus: range?.usable ?? 'Usable as public unicast if allocated and routed',
  };
}

export function parseCidr(cidr: string): CidrBlock {
  const [ip, p] = cidr.trim().split('/');
  const prefix = Number(p);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('CIDR prefix must be 0-32');
  const ipInt = ipToInt(ip);
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable = prefix >= 31 ? total : Math.max(total - 2, 0);
  const first = prefix >= 31 ? networkInt : networkInt + 1;
  const last = prefix >= 31 ? broadcastInt : broadcastInt - 1;
  const boundary = maskInt.toString(2).padStart(32, '0') + wildcardInt.toString(2).padStart(32, '0');
  return {
    cidr: `${intToIp(networkInt)}/${prefix}`,
    ip: intToIp(ipInt), prefix, networkInt, broadcastInt, maskInt, wildcardInt, total, usable,
    firstHost: intToIp(first), lastHost: intToIp(last), gateway: intToIp(first),
    network: intToIp(networkInt), broadcast: intToIp(broadcastInt), subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt), hostMask: intToIp(wildcardInt),
    binaryNetwork: networkInt.toString(2).padStart(32, '0').match(/.{1,8}/g)!.join('.'),
    hexNetwork: '0x' + networkInt.toString(16).toUpperCase().padStart(8, '0'),
    bitBoundary: `${'n'.repeat(prefix)}${'h'.repeat(32-prefix)}`.match(/.{1,8}/g)!.join('.'),
  };
}

export function cidrContains(parent: CidrBlock, child: CidrBlock): boolean {
  return child.networkInt >= parent.networkInt && child.broadcastInt <= parent.broadcastInt;
}

export function cidrOverlaps(a: CidrBlock, b: CidrBlock): boolean {
  return a.networkInt <= b.broadcastInt && b.networkInt <= a.broadcastInt;
}

export function nextPowerPrefix(requiredHosts: number): number {
  const need = requiredHosts <= 2 ? requiredHosts : requiredHosts + 2;
  const hostBits = Math.ceil(Math.log2(Math.max(need, 1)));
  return 32 - hostBits;
}
