import { ipToInt, parseCidr } from '../ip/ipv4';
export type RuleAction='allow'|'deny'; export type Direction='inbound'|'outbound';
export interface FirewallRule { id:string; priority:number; direction:Direction; action:RuleAction; protocol:'tcp'|'udp'|'icmp'|'all'; portFrom?:number; portTo?:number; cidr:string; }
export interface Packet { direction:Direction; protocol:'tcp'|'udp'|'icmp'; port?:number; peerIp:string; established?:boolean; }
export function evaluateAcl(rules: FirewallRule[], packet: Packet) {
  const ip=ipToInt(packet.peerIp);
  const matched=[...rules].filter(r=>r.direction===packet.direction).sort((a,b)=>a.priority-b.priority).find(r=>{
    const c=parseCidr(r.cidr); const proto=r.protocol==='all'||r.protocol===packet.protocol; const port=packet.protocol==='icmp'||r.protocol==='all'||packet.port===undefined||((r.portFrom??0)<=packet.port&&(r.portTo??65535)>=packet.port); return proto&&port&&ip>=c.networkInt&&ip<=c.broadcastInt;
  });
  return { allowed: matched?.action === 'allow', matchedRule: matched, explanation: matched ? `Rule ${matched.priority} ${matched.action}s packet.` : 'Implicit deny matched.' };
}
export function evaluateSecurityGroup(rules: FirewallRule[], packet: Packet) {
  if (packet.established) return { allowed:true, matchedRule: undefined, explanation:'Security groups are stateful: established return traffic is allowed.' };
  const res=evaluateAcl(rules.map(r=>({...r, action:'allow' as RuleAction})), packet); return { ...res, explanation: res.allowed ? 'Explicit security group allow rule matched.' : 'No security group allow rule matched; implicit deny.' };
}
