import { CidrBlock, cidrContains, cidrOverlaps, parseCidr } from '../ip/ipv4';

export type SubnetTier = 'public' | 'private' | 'database' | 'management';
export interface AwsSubnet { id: string; name: string; cidr: string; az: string; tier: SubnetTier; }
export interface VpcDesign { id: string; name: string; cidr: string; subnets: AwsSubnet[]; }
export interface ValidationIssue { severity: 'error'|'warning'|'info'; code: string; message: string; target?: string; explanation: string; }

export function validateVpc(design: VpcDesign): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let vpc: CidrBlock;
  try { vpc = parseCidr(design.cidr); } catch (e) { return [{ severity:'error', code:'INVALID_VPC_CIDR', message:String((e as Error).message), explanation:'A VPC must be a valid IPv4 CIDR block.' }]; }
  if (vpc.prefix < 16 || vpc.prefix > 28) issues.push({severity:'warning', code:'AWS_VPC_SIZE', message:'AWS VPC CIDR is usually /16 to /28.', explanation:'AWS allows IPv4 VPC CIDR blocks from /16 to /28.'});
  const parsed = design.subnets.map(s => { try { return { s, block: parseCidr(s.cidr) }; } catch(e) { issues.push({severity:'error', code:'INVALID_SUBNET_CIDR', target:s.id, message:`${s.name}: ${(e as Error).message}`, explanation:'Subnet CIDRs must use valid IPv4 CIDR notation.'}); return null; } }).filter(Boolean) as {s: AwsSubnet; block: CidrBlock}[];
  parsed.forEach(({s, block}) => {
    if (!cidrContains(vpc, block)) issues.push({severity:'error', code:'SUBNET_OUTSIDE_VPC', target:s.id, message:`${s.name} is outside VPC CIDR.`, explanation:'AWS subnets must be fully contained inside their VPC CIDR.'});
    if (block.prefix < 16 || block.prefix > 28) issues.push({severity:'warning', code:'AWS_SUBNET_SIZE', target:s.id, message:`${s.name} should be /16 to /28 for AWS IPv4 subnets.`, explanation:'AWS reserves five IP addresses per subnet and restricts IPv4 subnet sizes.'});
  });
  for (let i=0;i<parsed.length;i++) for (let j=i+1;j<parsed.length;j++) if (cidrOverlaps(parsed[i].block, parsed[j].block)) issues.push({severity:'error', code:'SUBNET_OVERLAP', target:`${parsed[i].s.id},${parsed[j].s.id}`, message:`${parsed[i].s.name} overlaps ${parsed[j].s.name}.`, explanation:'Overlapping subnet CIDRs create ambiguous routing and are rejected by AWS.'});
  const azs = new Set(design.subnets.map(s=>s.az));
  if (azs.size < 2) issues.push({severity:'info', code:'AZ_DISTRIBUTION', message:'Use at least two Availability Zones for production resiliency.', explanation:'Multi-AZ design improves fault isolation and service availability.'});
  return issues;
}

export function awsUsableIps(cidr: string): number { return Math.max(parseCidr(cidr).total - 5, 0); }
