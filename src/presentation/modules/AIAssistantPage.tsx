import { AssistantPanel } from './AssistantPanel';

export function AIAssistantPage() {
  return <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
    <section className="card p-6">
      <h2 className="text-3xl font-black">Module 20 — Built-in AI Assistant</h2>
      <p className="mt-2 text-slate-300">This assistant is now moved to its own page/tab, so the design workspace has more room. It can explain subnet calculations, review VPC designs, generate interview questions and create practice labs.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {['Explain CIDR in simple words','Generate subnet plan','Review AWS VPC design','Create interview questions','Troubleshoot missing route','Explain SG vs NACL'].map(x => <div key={x} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-semibold">{x}</div>)}
      </div>
    </section>
    <AssistantPanel activeTab="assistant" />
  </div>;
}
