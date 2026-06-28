import { motion } from 'framer-motion';
import { Boxes, BrainCircuit, Cloud, Download, GitBranch, Network, Route, Shield, TerminalSquare } from 'lucide-react';
import { useState } from 'react';
import { CalculatorSuite } from './modules/CalculatorSuite';
import { VpcDesigner } from './modules/VpcDesigner';
import { RoutingSimulator } from './modules/RoutingSimulator';
import { SecuritySimulator } from './modules/SecuritySimulator';
import { TopologyCanvas } from './modules/TopologyCanvas';
import { AIAssistantPage } from './modules/AIAssistantPage';
import { IpamPanel } from './modules/IpamPanel';

const tabs = [
  { id:'calculators', label:'IP/CIDR Lab', icon: TerminalSquare },
  { id:'vpc', label:'AWS VPC Designer', icon: Cloud },
  { id:'topology', label:'Topology & Packet Flow', icon: Network },
  { id:'routing', label:'Route Simulator', icon: Route },
  { id:'security', label:'SG / NACL', icon: Shield },
  { id:'ipam', label:'IPAM', icon: Boxes },
  { id:'assistant', label:'AI Assistant', icon: BrainCircuit },
] as const;
type Tab = typeof tabs[number]['id'];

export function App() {
  const [tab,setTab]=useState<Tab>('calculators');
  return <div className="min-h-screen bg-ink text-slate-100 codegrid">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] items-center gap-4 px-4 py-3">
        <motion.div initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyanx to-vio shadow-glow"><GitBranch /></motion.div>
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black tracking-tight">IP Intelligence Platform</h1><p className="text-xs text-slate-400">Learn • Design • Validate • Simulate • Troubleshoot networks locally</p></div>
        <div className="hidden items-center gap-2 lg:flex"><span className="badge"><BrainCircuit size={14}/> Offline AI coach</span><span className="badge"><Download size={14}/> Export ready</span></div>
      </div>
      <nav className="mx-auto flex max-w-[1800px] gap-2 overflow-x-auto px-4 pb-3">{tabs.map(t=>{ const Icon=t.icon; return <button key={t.id} onClick={()=>setTab(t.id)} className={`btn whitespace-nowrap ${tab===t.id?'border-cyanx/50 bg-cyanx/15 text-cyan-100':''}`}><Icon size={16} className="inline"/> {t.label}</button>;})}</nav>
    </header>
    <main className="mx-auto max-w-[2000px] p-4">
      <section className="min-h-[calc(100vh-150px)]">{tab==='calculators'&&<CalculatorSuite/>}{tab==='vpc'&&<VpcDesigner/>}{tab==='topology'&&<TopologyCanvas/>}{tab==='routing'&&<RoutingSimulator/>}{tab==='security'&&<SecuritySimulator/>}{tab==='ipam'&&<IpamPanel/>}{tab==='assistant'&&<AIAssistantPage/>}</section>
    </main>
  </div>;
}
