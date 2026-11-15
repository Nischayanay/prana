import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight } from '@untitledui/icons';
import { ChartTooltipContent } from '@/components/application/charts/charts-base';
import { I4_MARKERS, I4_SAMPLES } from '@/data/inspiration4';
import { cx } from '@/utils/cx';
import { Seg } from './trends';
import { Card, DataTag, PageHeader } from '@/app/ui';

const CREWS = ['C001', 'C002', 'C003', 'C004'];
const ORDER = ['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194'];
const COLORS = ['#155EEF', '#17B26A', '#F79009', '#7A5AF8'];
function personal(crew: string, k: string) {
  const pre = I4_SAMPLES.filter((s) => s.crew === crew && s.phase === 'pre').map((s) => s.values[k]).filter((x): x is number => x != null);
  const mean = pre.reduce((a, b) => a + b, 0) / pre.length;
  const sd = Math.sqrt(pre.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, pre.length - 1));
  return { mean, sd: Math.max(sd, mean * 0.04) };
}

export default function Evidence() {
  const [k, setK] = useState('glucose');
  const [crew, setCrew] = useState('C003');
  const mk = I4_MARKERS[k];
  const rows = ORDER.map((label) => { const r: Record<string, number | string | null> = { label }; CREWS.forEach((c) => { r[c] = I4_SAMPLES.find((s) => s.crew === c && s.label === label)?.values[k] ?? null; }); return r; });
  const pb = personal(crew, k);
  const r1 = useMemo(() => Object.keys(I4_MARKERS).map((key) => {
    const M = I4_MARKERS[key];
    return { key, M, cells: CREWS.map((c) => {
      const v = I4_SAMPLES.find((s) => s.crew === c && s.label === 'R+1')?.values[key]; const p = personal(c, key);
      if (v == null) return null;
      return { pct: ((v - p.mean) / p.mean) * 100, outLab: (M.min != null && v < M.min) || (M.max != null && v > M.max), outPersonal: Math.abs((v - p.mean) / p.sd) >= 2 };
    }) };
  }), []);
  const personalOnly = r1.reduce((n, row) => n + row.cells.filter((c) => c && c.outPersonal && !c.outLab).length, 0);
  const labFlags = r1.reduce((n, row) => n + row.cells.filter((c) => c && c.outLab).length, 0);
  const gl = CREWS.map((c) => { const v = I4_SAMPLES.find((s) => s.crew === c && s.label === 'R+1')!.values.glucose!; const p = personal(c, 'glucose'); return ((v - p.mean) / p.mean) * 100; });
  const lowR45 = CREWS.filter((c) => (I4_SAMPLES.find((s) => s.crew === c && s.label === 'R+45')?.values.glucose ?? 99) < 54).length;

  return (
    <div>
      <PageHeader eyebrow="Evidence" title="Tested on real astronaut data" description={<>PRANA's personal-baseline method applied to blood tests from the 4 SpaceX Inspiration4 crew (Sept 2021), from <a className="font-medium text-brand-secondary underline" href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-575" target="_blank" rel="noreferrer">NASA OSDR OSD-575</a>. Samples 92/44/3 days before launch (L-) and 1/45/82/194 days after return (R+).</>} actions={<DataTag real />} />
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Card><p className="text-sm font-medium text-tertiary">Caught only by personal baseline</p><p className="mt-2 text-display-md font-semibold text-brand-secondary tabular">{personalOnly}</p><p className="mt-1 text-sm text-tertiary">changes the day after landing that are outside the person's <b>own</b> normal but inside the lab's population range: invisible on a standard report. (Lab-range flags: {labFlags}.)</p></Card>
        <Card><p className="text-sm font-medium text-tertiary">Blood sugar after landing</p><p className="mt-2 text-display-md font-semibold text-warning-primary tabular">+{Math.round(gl.reduce((x, y) => x + y, 0) / 4)}%</p><p className="mt-1 text-sm text-tertiary">average rise at R+1 vs each person's pre-flight mean (+{Math.round(Math.min(...gl))}% to +{Math.round(Math.max(...gl))}%). Only one reading is outside the lab range.</p></Card>
        <Card><p className="text-sm font-medium text-tertiary">Check before you act</p><p className="mt-2 text-display-md font-semibold text-primary tabular">{lowR45}/4</p><p className="mt-1 text-sm text-tertiary">crew had glucose under 54 mg/dL at R+45, all at once and without reported symptoms. PRANA's rule: an implausible single value → <b>retest first</b>; it may be a sample-handling artefact.</p></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" title={mk.name} subtitle={`Grey band: lab range ${mk.min}–${mk.max} ${mk.unit} · Blue band: ${crew}'s personal normal`}
          action={<select className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary ring-inset" value={k} onChange={(e) => setK(e.target.value)}>{Object.entries(I4_MARKERS).map(([key, m]) => <option key={key} value={key}>{m.name}</option>)}</select>}>
          <Seg items={CREWS.map((c) => ({ id: c, label: c }))} value={crew} onChange={setCrew} />
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={rows} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#EAECF0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#667085', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} domain={['auto', 'auto']} tick={{ fill: '#667085', fontSize: 12 }} />
                {mk.min != null && mk.max != null && <ReferenceArea y1={mk.min} y2={mk.max} fill="#98A2B3" fillOpacity={0.08} />}
                <ReferenceArea y1={pb.mean - 2 * pb.sd} y2={pb.mean + 2 * pb.sd} fill="#155EEF" fillOpacity={0.1} />
                <ReferenceLine x="R+1" stroke="#F79009" strokeDasharray="3 3" label={{ value: 'Landing', fill: '#F79009', fontSize: 11, position: 'insideTopLeft' }} />
                <Tooltip content={<ChartTooltipContent />} formatter={(v) => `${v} ${mk.unit}`} />
                {CREWS.map((c, i) => <Line key={c} dataKey={c} stroke={COLORS[i]} strokeWidth={c === crew ? 3 : 1.25} strokeOpacity={c === crew ? 1 : 0.35} dot={{ r: c === crew ? 4 : 2 }} isAnimationActive={false} connectNulls />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="lg:col-span-2" title="Day after landing vs own baseline" subtitle="Change from each person's pre-flight mean" bodyClassName="p-0">
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary"><tr className="text-left text-xs text-tertiary"><th className="px-4 py-2 font-medium">Marker</th>{CREWS.map((c) => <th key={c} className="px-2 py-2 text-right font-medium">{c}</th>)}</tr></thead>
              <tbody>{r1.map((row) => (
                <tr key={row.key} onClick={() => setK(row.key)} className={cx('cursor-pointer border-t border-secondary hover:bg-primary_hover', row.key === k && 'bg-brand-primary')}>
                  <td className="px-4 py-2 text-secondary">{row.M.name}</td>
                  {row.cells.map((c, i) => <td key={i} className={cx('px-2 py-2 text-right tabular', !c ? '' : c.outLab ? 'font-semibold text-error-primary' : c.outPersonal ? 'font-semibold text-warning-primary' : 'text-tertiary')}>{c ? `${c.pct > 0 ? '+' : ''}${c.pct.toFixed(0)}%` : '–'}</td>)}
                </tr>))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-secondary px-4 py-3 text-xs text-quaternary"><span className="font-semibold text-warning-primary">Amber</span>: outside personal normal (±2 SD) · <span className="font-semibold text-error-primary">Red</span>: outside lab range. n = 4 on a 3-day flight: this demonstrates the method, not a clinical finding. <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-575" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand-secondary">Source<ArrowUpRight className="size-3" /></a></p>
        </Card>
      </div>
    </div>
  );
}
