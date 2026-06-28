import { ExplanationStep } from '../../domain/ip/explanations';

export function ExplanationSteps({ steps }: { steps: ExplanationStep[] }) {
  return <div className="mt-4 rounded-2xl border border-cyanx/20 bg-cyanx/5 p-4">
    <h4 className="text-lg font-black text-cyan-100">Inner calculation — simple arithmetic explanation</h4>
    <div className="mt-3 space-y-3">
      {steps.map((s, i) => <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyanx/20 text-xs font-bold text-cyan-100">{i + 1}</span><b>{s.title}</b></div>
        <div className="mt-2 rounded-lg bg-black/30 p-2 font-mono text-sm text-emerald-100">{s.arithmetic}</div>
        <p className="mt-2 text-sm text-slate-300"><b>Simple meaning:</b> {s.simple}</p>
      </div>)}
    </div>
  </div>;
}
