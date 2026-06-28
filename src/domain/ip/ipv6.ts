export interface IPv6Analysis {
  normalized: string;
  expanded: string;
  binary: string;
  hexadecimal: string;
  addressType: string;
  rfc: string;
  reservedStatus: string;
  usableStatus: string;
}

export function expandIPv6(input: string): string {
  const value = input.trim().toLowerCase();
  if (!value.includes(':')) throw new Error('IPv6 must contain colon separators');
  const [leftRaw, rightRaw] = value.split('::');
  if (value.split('::').length > 2) throw new Error('IPv6 can contain only one ::');
  const left = leftRaw ? leftRaw.split(':') : [];
  const right = rightRaw ? rightRaw.split(':') : [];
  const missing = value.includes('::') ? 8 - left.length - right.length : 0;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8) throw new Error('IPv6 must expand to eight groups');
  return groups.map(g => {
    if (!/^[0-9a-f]{0,4}$/.test(g)) throw new Error('Invalid IPv6 hextet');
    return g.padStart(4, '0');
  }).join(':');
}

export function analyzeIPv6(input: string): IPv6Analysis {
  const expanded = expandIPv6(input);
  const hex = expanded.replaceAll(':', '');
  const binary = [...hex].map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
  let addressType = 'global-unicast', rfc = 'RFC 4291', usableStatus = 'Globally routable if allocated';
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') { addressType='loopback'; rfc='RFC 4291'; usableStatus='Local host only'; }
  else if (expanded.startsWith('0000:0000:0000:0000:0000:0000:0000:0000')) { addressType='unspecified'; usableStatus='Not assignable'; }
  else if (binary.startsWith('11111111')) { addressType='multicast'; rfc='RFC 4291'; usableStatus='Multicast, not host unicast'; }
  else if (binary.startsWith('1111111010')) { addressType='link-local'; rfc='RFC 4291 fe80::/10'; usableStatus='Link-local only'; }
  else if (binary.startsWith('1111110')) { addressType='unique-local'; rfc='RFC 4193 fc00::/7'; usableStatus='Private IPv6 addressing'; }
  else if (expanded.startsWith('2001:0db8')) { addressType='documentation'; rfc='RFC 3849 2001:db8::/32'; usableStatus='Documentation only'; }
  return { normalized: expanded.replace(/(^|:)0{1,3}/g, '$1'), expanded, binary, hexadecimal: '0x'+hex.toUpperCase(), addressType, rfc, reservedStatus: addressType === 'global-unicast' || addressType === 'unique-local' ? 'Not reserved' : 'Special-use/reserved', usableStatus };
}
