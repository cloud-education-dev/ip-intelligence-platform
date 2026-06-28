import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VpcDesign } from '../domain/aws/vpc';

export interface InventoryHost { id: string; name: string; ip: string; subnetId?: string; tags: string[]; status:'allocated'|'reserved'|'released'|'locked'; }
export interface Project { id: string; name: string; organization: string; vpcs: VpcDesign[]; hosts: InventoryHost[]; updatedAt: string; }
interface HistoryState { projects: Project[]; selectedProjectId?: string; past: Project[][]; future: Project[][]; }
interface Actions { addProject(name:string):void; saveVpc(vpc:VpcDesign):void; allocateHost(host:InventoryHost):void; undo():void; redo():void; }
const initialVpc: VpcDesign = { id:'vpc-demo', name:'Production VPC', cidr:'10.20.0.0/16', subnets:[
  {id:'subnet-public-a', name:'Public A', cidr:'10.20.0.0/24', az:'ap-south-1a', tier:'public'},
  {id:'subnet-private-a', name:'Private A', cidr:'10.20.10.0/24', az:'ap-south-1a', tier:'private'},
  {id:'subnet-db-a', name:'Database A', cidr:'10.20.20.0/24', az:'ap-south-1a', tier:'database'},
  {id:'subnet-public-b', name:'Public B', cidr:'10.20.1.0/24', az:'ap-south-1b', tier:'public'},
] };
const seed: Project[] = [{ id:'project-demo', name:'Demo Cloud Network', organization:'Arena Labs', vpcs:[initialVpc], hosts:[{id:'host-web-1', name:'web-1', ip:'10.20.0.10', subnetId:'subnet-public-a', tags:['web'], status:'allocated'}], updatedAt:new Date().toISOString() }];
function snapshot(s: HistoryState, projects: Project[]): Partial<HistoryState> { return { past:[...s.past, s.projects].slice(-50), future:[], projects }; }
export const useIpamStore = create<HistoryState & Actions>()(persist((set,get)=>({ projects: seed, selectedProjectId:'project-demo', past:[], future:[],
  addProject:(name)=>set(s=>snapshot(s,[...s.projects,{id:crypto.randomUUID(),name,organization:'Default',vpcs:[],hosts:[],updatedAt:new Date().toISOString()}])),
  saveVpc:(vpc)=>set(s=>{ const id=s.selectedProjectId; return snapshot(s, s.projects.map(p=>p.id===id?{...p,vpcs:[...p.vpcs.filter(x=>x.id!==vpc.id),vpc],updatedAt:new Date().toISOString()}:p)); }),
  allocateHost:(host)=>set(s=>{ const id=s.selectedProjectId; return snapshot(s, s.projects.map(p=>p.id===id?{...p,hosts:[...p.hosts.filter(h=>h.id!==host.id),host],updatedAt:new Date().toISOString()}:p)); }),
  undo:()=>set(s=>s.past.length?{projects:s.past[s.past.length-1]!,past:s.past.slice(0,-1),future:[s.projects,...s.future]}:s),
  redo:()=>set(s=>s.future.length?{projects:s.future[0],future:s.future.slice(1),past:[...s.past,s.projects]}:s),
}),{ name:'ip-intelligence-platform-v1' }));
export function useSelectedProject(){ return useIpamStore(s=>s.projects.find(p=>p.id===s.selectedProjectId) ?? s.projects[0]); }
