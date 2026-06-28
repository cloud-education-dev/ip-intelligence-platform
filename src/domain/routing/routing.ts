import { ipToInt, parseCidr } from '../ip/ipv4';
export interface Route { id: string; destination: string; target: string; priority?: number; }
export interface LookupResult { route?: Route; reason: string; candidates: Route[]; }
export function lookupRoute(routes: Route[], destIp: string): LookupResult {
  try {
    const dest = ipToInt(destIp);
    const candidates = routes.filter(r => { const b = parseCidr(r.destination); return dest >= b.networkInt && dest <= b.broadcastInt; })
      .sort((a,b)=> parseCidr(b.destination).prefix - parseCidr(a.destination).prefix || (a.priority ?? 100) - (b.priority ?? 100));
    return { route: candidates[0], candidates, reason: candidates[0] ? `Matched longest prefix ${candidates[0].destination} to ${candidates[0].target}` : 'No matching route; packet is dropped.' };
  } catch (e) {
    return { route: undefined, candidates: [], reason: `Invalid destination IP: ${(e as Error).message}` };
  }
}
