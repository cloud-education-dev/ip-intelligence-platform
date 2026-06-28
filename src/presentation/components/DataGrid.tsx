export function DataGrid({ rows }: { rows: Record<string, unknown> }) {
  return <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{Object.entries(rows).map(([k,v])=><div key={k} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-xs uppercase tracking-wide text-slate-500">{k}</div><div className="break-all font-mono text-sm text-slate-100">{String(v)}</div></div>)}</div>;
}
