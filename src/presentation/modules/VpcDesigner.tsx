import { DragEvent, useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, NodeProps, OnConnect, addEdge, Connection, ReactFlowProvider, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Cloud, Database, Edit3, Globe2, Lock, Network, Route, Shield, Trash2, Wifi, Server, KeyRound, Cable, Link2, Boxes, HardDrive, GitBranch, Waypoints, PlusCircle, MousePointer2 } from 'lucide-react';
import { AwsSubnet, SubnetTier, validateVpc, awsUsableIps, VpcDesign } from '../../domain/aws/vpc';
import { parseCidr } from '../../domain/ip/ipv4';
import { downloadText, exportContainerlab, exportTerraform, exportVpcJson, exportVpcYaml } from '../../application/exporters';

type AwsComponent = 'VPC' | 'Public Subnet' | 'Private Subnet' | 'Database Subnet' | 'Management Subnet' | 'Internet Gateway' | 'NAT Gateway' | 'Transit Gateway' | 'Route Table' | 'Security Group' | 'Network ACL' | 'Elastic IP' | 'ENI' | 'Load Balancer' | 'VPN Gateway' | 'Direct Connect' | 'VPC Peering' | 'PrivateLink' | 'VPC Endpoint';
type ServiceKind = AwsComponent | SubnetTier | 'vpc' | 'component';
type ExtraComponent = { id:string; type:AwsComponent; x:number; y:number };
type Selected = { kind:'vpc' } | { kind:'subnet'; id:string } | { kind:'component'; id:string } | null;

const palette: AwsComponent[] = ['VPC','Public Subnet','Private Subnet','Database Subnet','Management Subnet','Internet Gateway','NAT Gateway','Transit Gateway','Route Table','Security Group','Network ACL','Elastic IP','ENI','Load Balancer','VPN Gateway','Direct Connect','VPC Peering','PrivateLink','VPC Endpoint'];
const tierMap: Record<string, SubnetTier> = { 'Public Subnet':'public', 'Private Subnet':'private', 'Database Subnet':'database', 'Management Subnet':'management' };
const colors: Record<string,string> = { public:'#0e7490', private:'#6d28d9', database:'#047857', management:'#b45309', component:'#334155', vpc:'#0369a1' };

function iconFor(kind: ServiceKind) {
  if (kind === 'vpc' || kind === 'VPC') return <Cloud size={22}/>;
  if (kind === 'public' || kind === 'Public Subnet' || kind === 'Internet Gateway') return <Globe2 size={22}/>;
  if (kind === 'private' || kind === 'Private Subnet') return <Lock size={22}/>;
  if (kind === 'database' || kind === 'Database Subnet') return <Database size={22}/>;
  if (kind === 'management' || kind === 'Management Subnet') return <Server size={22}/>;
  if (kind === 'NAT Gateway') return <Wifi size={22}/>;
  if (kind === 'Transit Gateway') return <GitBranch size={22}/>;
  if (kind === 'Route Table') return <Route size={22}/>;
  if (kind === 'Security Group' || kind === 'Network ACL') return <Shield size={22}/>;
  if (kind === 'Elastic IP') return <KeyRound size={22}/>;
  if (kind === 'ENI') return <HardDrive size={22}/>;
  if (kind === 'Load Balancer') return <Boxes size={22}/>;
  if (kind === 'VPN Gateway' || kind === 'Direct Connect') return <Cable size={22}/>;
  if (kind === 'VPC Peering' || kind === 'PrivateLink' || kind === 'VPC Endpoint') return <Link2 size={22}/>;
  return <Network size={22}/>;
}

function ServiceNode({ data }: NodeProps<{ title:string; subtitle?:string; kind:ServiceKind; removable:boolean; onEdit:()=>void; onRemove:()=>void }>) {
  const bg = colors[data.kind as string] ?? colors.component;
  return <div className="relative min-w-[190px] rounded-2xl border border-white/30 p-3 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${bg}, #0f172a)` }}>
    <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-cyan-300" />
    <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-yellow-300" />
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-white/15 p-2">{iconFor(data.kind)}</div>
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{data.title}</div>{data.subtitle && <div className="whitespace-pre-line text-[11px] text-slate-200">{data.subtitle}</div>}</div>
    </div>
    <div className="mt-3 flex gap-2"><button className="nodrag rounded-lg bg-white/15 px-2 py-1 text-xs font-bold hover:bg-white/25" onClick={data.onEdit}><Edit3 size={12} className="inline"/> Edit</button>{data.removable && <button className="nodrag rounded-lg bg-rose-500/25 px-2 py-1 text-xs font-bold hover:bg-rose-500/40" onClick={data.onRemove}><Trash2 size={12} className="inline"/> Remove</button>}</div>
  </div>;
}
const nodeTypes = { service: ServiceNode };

export function VpcDesigner(){ return <ReactFlowProvider><VpcDesignerInner/></ReactFlowProvider>; }

function VpcDesignerInner(){
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [design,setDesign]=useState<VpcDesign>({ id:'custom-vpc', name:'My Custom VPC', cidr:'10.0.0.0/16', subnets:[] });
  const [components,setComponents]=useState<ExtraComponent[]>([]);
  const [selected,setSelected]=useState<Selected>({kind:'vpc'});
  const [newSubnet,setNewSubnet]=useState<AwsSubnet>({id:'',name:'Public Subnet A',cidr:'10.0.1.0/24',az:'ap-south-1a',tier:'public'});
  const [editingComponent,setEditingComponent]=useState<ExtraComponent | null>(null);
  const [manualEdges,setManualEdges]=useState<Edge[]>([]);
  const issues=validateVpc(design);
  const capacity=useMemo(()=>capacityReport(design),[design]);

  const removeSubnet = useCallback((id:string) => { setDesign(d=>({...d, subnets:d.subnets.filter(s=>s.id!==id)})); setManualEdges(es=>es.filter(e=>e.source!==id && e.target!==id)); setSelected({kind:'vpc'}); },[]);
  const removeComponent = useCallback((id:string) => { setComponents(c=>c.filter(x=>x.id!==id)); setManualEdges(es=>es.filter(e=>e.source!==id && e.target!==id)); setSelected({kind:'vpc'}); setEditingComponent(null); },[]);
  const editSubnet = useCallback((id:string) => { const s=design.subnets.find(x=>x.id===id); if(s){ setNewSubnet(s); setSelected({kind:'subnet',id}); } },[design.subnets]);
  const editComponent = useCallback((id:string) => { const c=components.find(x=>x.id===id); if(c){ setEditingComponent(c); setSelected({kind:'component',id}); } },[components]);

  const nodes:Node[]=useMemo(()=>[
    {id:design.id, type:'service', position:{x:40,y:70}, data:{title:design.name, subtitle:design.cidr, kind:'vpc', removable:false, onEdit:()=>setSelected({kind:'vpc'}), onRemove:()=>{}}},
    ...design.subnets.map((s,i)=>({id:s.id, type:'service', position:{x:320+(i%2)*270,y:40+Math.floor(i/2)*155}, data:{title:s.name, subtitle:`${s.cidr}\n${s.az} • ${awsUsableIps(s.cidr)} AWS usable`, kind:s.tier, removable:true, onEdit:()=>editSubnet(s.id), onRemove:()=>removeSubnet(s.id)}})),
    ...components.map(c=>({id:c.id, type:'service', position:{x:c.x,y:c.y}, data:{title:c.type, subtitle:'AWS service', kind:c.type, removable:true, onEdit:()=>editComponent(c.id), onRemove:()=>removeComponent(c.id)}}))
  ],[design,components,editSubnet,editComponent,removeSubnet,removeComponent]);

  const defaultEdges:Edge[]=useMemo(()=>design.subnets.map(s=>({id:`auto-${s.id}`, source:design.id, target:s.id, animated:s.tier==='public', label:s.tier, style:{stroke:'#67e8f9'}})),[design]);
  const onConnect: OnConnect = useCallback((connection: Connection) => setManualEdges((eds) => addEdge({ ...connection, id:`manual-${crypto.randomUUID()}`, animated:true, label:'custom connection', style:{stroke:'#fbbf24', strokeWidth:2} }, eds)), []);

  function addSubnet(){ const id=newSubnet.id || `${newSubnet.tier}-${crypto.randomUUID().slice(0,6)}`; const saved={...newSubnet,id}; setDesign(d=>({...d, subnets:[...d.subnets.filter(s=>s.id!==id),saved]})); setNewSubnet(saved); setSelected({kind:'subnet',id}); }
  function deleteSelected(){ if(selected?.kind==='subnet') removeSubnet(selected.id); if(selected?.kind==='component') removeComponent(selected.id); }
  function saveComponent(){ if(!editingComponent) return; setComponents(cs=>cs.map(c=>c.id===editingComponent.id?editingComponent:c)); }
  function addFromPalette(type:AwsComponent){
    if(type==='VPC'){ setSelected({kind:'vpc'}); return; }
    if(tierMap[type]){ const tier=tierMap[type]; const s={id:'',name:type,cidr:suggestSubnet(design,tier),az:'ap-south-1a',tier}; setNewSubnet(s); setSelected({kind:'subnet', id:''}); return; }
    const count=components.length; const item={id:`${type.toLowerCase().replaceAll(' ','-')}-${crypto.randomUUID().slice(0,6)}`,type,x:350+(count%3)*230,y:280+Math.floor(count/3)*140}; setComponents(c=>[...c,item]); setEditingComponent(item); setSelected({kind:'component',id:item.id});
  }
  function onDrop(e:DragEvent){ e.preventDefault(); e.stopPropagation(); const type=e.dataTransfer.getData('application/aws-component') || e.dataTransfer.getData('text/plain'); if(type) addFromPalette(type as AwsComponent); }

  return <div className="grid gap-4 xl:grid-cols-[230px_1fr_380px]">
    <aside className="card p-4"><h3 className="font-black">Add AWS Components</h3><p className="text-xs text-slate-400">Click + Add if browser drag/drop does not work. You can also drag items to the canvas.</p><div className="mt-3 grid gap-2">{palette.map(p=><div key={p} draggable onDragStart={e=>{e.dataTransfer.setData('application/aws-component',p); e.dataTransfer.setData('text/plain',p); e.dataTransfer.effectAllowed='copy';}} className="flex cursor-grab items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-2 text-sm hover:bg-cyanx/15 active:cursor-grabbing"><span className="text-cyan-100">{iconFor(p)}</span><span className="min-w-0 flex-1 truncate">{p}</span><button className="rounded-lg bg-cyanx/20 px-2 py-1 text-xs font-bold text-cyan-100 hover:bg-cyanx/30" onClick={()=>addFromPalette(p)}>+ Add</button></div>)}</div></aside>
    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="text-2xl font-black">Module 7 / 14 — Custom AWS VPC CIDR Designer</h2><p className="text-sm text-slate-400">Click + Add or drag services. Connect nodes by dragging the yellow handle to a blue handle.</p></div><div className="badge"><MousePointer2 size={14}/> Click + Add works without drag/drop</div></div><div ref={wrapperRef} className="h-[820px]" onDrop={onDrop} onDragOver={e=>{e.preventDefault(); e.dataTransfer.dropEffect='copy';}}><ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={[...defaultEdges,...manualEdges]} onConnect={onConnect} fitView defaultEdgeOptions={{type:'smoothstep'}}><Controls className="!bg-slate-900 !text-white"/><Background color="#334155" gap={22}/></ReactFlow></div></section>
    <aside className="space-y-4"><div className="card p-4"><h3 className="font-bold">Editor</h3>{selected?.kind==='vpc' && <div><label>VPC Name</label><input className="input" value={design.name} onChange={e=>setDesign({...design,name:e.target.value})}/><label>VPC CIDR</label><input className="input" value={design.cidr} onChange={e=>setDesign({...design,cidr:e.target.value})}/></div>}{(selected?.kind==='subnet' || selected === null) && <SubnetEditor newSubnet={newSubnet} setNewSubnet={setNewSubnet} addSubnet={addSubnet} canRemove={!!newSubnet.id} onRemove={()=>newSubnet.id && removeSubnet(newSubnet.id)}/>} {selected?.kind==='component' && editingComponent && <div><label>Service Type</label><input className="input" value={editingComponent.type} readOnly/><label>X Position</label><input className="input" type="number" value={Math.round(editingComponent.x)} onChange={e=>setEditingComponent({...editingComponent,x:Number(e.target.value)})}/><label>Y Position</label><input className="input" type="number" value={Math.round(editingComponent.y)} onChange={e=>setEditingComponent({...editingComponent,y:Number(e.target.value)})}/><button className="btn mt-3 w-full" onClick={saveComponent}><Edit3 size={14} className="inline"/> Save Service</button><button className="btn mt-2 w-full border-bad/40 bg-bad/15" onClick={()=>removeComponent(editingComponent.id)}><Trash2 size={14} className="inline"/> Remove Service</button></div>}{selected && selected.kind!=='vpc' && <button className="btn mt-3 w-full border-bad/40 bg-bad/15" onClick={deleteSelected}><Trash2 size={14} className="inline"/> Remove Selected</button>}</div>
      <div className="card p-4"><h3 className="font-bold">Automatic Detection</h3><Metric label="Total VPC IPs" value={capacity.total}/><Metric label="AWS reserved IPs" value={capacity.reserved}/><Metric label="Available subnet IPs" value={capacity.available}/><Metric label="Unused VPC space" value={capacity.unused}/><Metric label="Future capacity" value={capacity.future}/><Metric label="AZ count" value={capacity.azCount}/>{issues.map(i=><div key={i.code+i.target} className={`mt-2 rounded-xl border p-3 text-sm ${i.severity==='error'?'border-bad/30 bg-bad/10':i.severity==='warning'?'border-warn/30 bg-warn/10':'border-cyanx/30 bg-cyanx/10'}`}><b>{i.code}</b><p>{i.message}</p><p className="text-slate-400">{i.explanation}</p></div>)}</div>
      <div className="card p-4"><h3 className="font-bold">Exports</h3><div className="mt-3 grid grid-cols-2 gap-2"><button className="btn" onClick={()=>downloadText('custom-vpc.json',exportVpcJson(design),'application/json')}>JSON</button><button className="btn" onClick={()=>downloadText('custom-vpc.yaml',exportVpcYaml(design),'text/yaml')}>YAML</button><button className="btn" onClick={()=>downloadText('main.tf',exportTerraform(design))}>Terraform</button><button className="btn" onClick={()=>downloadText('containerlab.yaml',exportContainerlab(design),'text/yaml')}>Containerlab</button></div></div></aside>
  </div>;
}
function SubnetEditor({newSubnet,setNewSubnet,addSubnet,canRemove,onRemove}:{newSubnet:AwsSubnet; setNewSubnet:(s:AwsSubnet)=>void; addSubnet:()=>void; canRemove:boolean; onRemove:()=>void}){return <div><h4 className="mt-2 font-bold text-cyan-100">Subnet Editor</h4><label>Name</label><input className="input" value={newSubnet.name} onChange={e=>setNewSubnet({...newSubnet,name:e.target.value})}/><label>CIDR</label><input className="input" value={newSubnet.cidr} onChange={e=>setNewSubnet({...newSubnet,cidr:e.target.value})}/><label>AZ</label><input className="input" value={newSubnet.az} onChange={e=>setNewSubnet({...newSubnet,az:e.target.value})}/><label>Tier</label><select className="input" value={newSubnet.tier} onChange={e=>setNewSubnet({...newSubnet,tier:e.target.value as SubnetTier})}><option value="public">Public Subnet</option><option value="private">Private Subnet</option><option value="database">Database Subnet</option><option value="management">Management Subnet</option></select><button className="btn mt-3 w-full" onClick={addSubnet}><PlusCircle size={14} className="inline"/> Save Subnet</button>{canRemove && <button className="btn mt-2 w-full border-bad/40 bg-bad/15" onClick={onRemove}><Trash2 size={14} className="inline"/> Remove Subnet</button>}</div>}
function capacityReport(vpc:VpcDesign){ try{ const parent=parseCidr(vpc.cidr); const subnetBlocks=vpc.subnets.map(s=>parseCidr(s.cidr)); const used=subnetBlocks.reduce((a,b)=>a+b.total,0); const reserved=vpc.subnets.length*5; const available=subnetBlocks.reduce((a,b)=>a+Math.max(b.total-5,0),0); const unused=Math.max(parent.total-used,0); const future=Math.floor(unused/256); const azCount=new Set(vpc.subnets.map(s=>s.az)).size; return {total:parent.total,reserved,available,unused,future:`${future} more /24 subnets`,azCount}; } catch { return {total:'Invalid',reserved:'-',available:'-',unused:'-',future:'-',azCount:'-'}; } }
function Metric({label,value}:{label:string;value:unknown}){return <div className="mt-2 flex justify-between rounded-lg bg-white/10 px-3 py-2 text-sm"><span className="text-slate-400">{label}</span><b className="font-mono">{String(value)}</b></div>}
function suggestSubnet(design:VpcDesign,tier:SubnetTier){ const base={public:'10.0.1.0/24',private:'10.0.10.0/24',database:'10.0.20.0/24',management:'10.0.30.0/24'}[tier]; return base.replace('10.0',design.cidr.split('.').slice(0,2).join('.')); }
