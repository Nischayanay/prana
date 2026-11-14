import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { I4_MARKERS, I4_SAMPLES } from '../data/inspiration4';
import { RealTag } from './ui';

const CREWS = ['C001', 'C002', 'C003', 'C004'];
const ORDER = ['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194'];
const COLORS = ['#5eead4', '#7dd3fc', '#fbbf24', '#c4b5fd'];

function personal(crew: string, k: string) {
  const pre = I4_SAMPLES.filter((s) => s.crew === crew && s.phase === 'pre').map((s) => s.values[k]).filter((x): x is number => x != null);
  const mean = pre.reduce((a, b) => a + b, 0) / pre.length;
  const sd = Math.sqrt(pre.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, pre.length - 1));
  return { mean, sd: Math.max(sd, mean * 0.04) };
}

export default function RealData() {
  const [k, setK] = useState('glucose');
  const [crew, setCrew] = useState('C003');
  const mk = I4_MARKERS[k];
  const rows = ORDER.map((label) => {
    const r: Record<string, number | string | null> = { label };
    CREWS.forEach((c) => { r[c] = I4_SAMPLES.find((s) => s.crew === c && s.label === label)?.values[k] ?? null; });
    return r;
  });
  const pb = personal(crew, k);

  const r1 = useMemo(() => Object.keys(I4_MARKERS).map((key) => {
    const M = I4_MARKERS[key];
    return {
      key, M, cells: CREWS.map((c) => {
        const v = I4_SAMPLES.find((s) => s.crew === c && s.label === 'R+1')?.values[key];
        const p = personal(c, key);
        if (v == null) return null;
        const outLab = (M.min != null && v < M.min) || (M.max != null && v > M.max);
        const z = (v - p.mean) / p.sd;
        return { v, pct: ((v - p.mean) / p.mean) * 100, outLab, outPersonal: Math.abs(z) >= 2 };
      }),
    };
  }), []);
  const personalOnly = r1.reduce((n, row) => n + row.cells.filter((c) => c && c.outPersonal && !c.outLab).length, 0);
  const labFlags = r1.reduce((n, row) => n + row.cells.filter((c) => c && c.outLab).length, 0);
  const gl = CREWS.map((c) => { const v = I4_SAMPLES.find((s) => s.crew === c && s.label === 'R+1')!.values.glucose!; return ((v - personal(c, 'glucose').mean) / personal(c, 'glucose').mean) * 100; });
  const lowR45 = CREWS.filter((c) => (I4_SAMPLES.find((s) => s.crew === c && s.label === 'R+45')?.values.glucose ?? 99) < 54).length;

  return (
    <div>
      <div className="section-head">
        <div><div className="upper">Validation on real astronauts</div><h2>Inspiration4 crew blood panel</h2></div>
        <RealTag />
      </div>
      <div className="banner info mb small">
        Source: <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-575" target="_blank" rel="noreferrer">NASA Open Science Data Repository OSD-575</a>. Comprehensive metabolic panel from the 4 SpaceX Inspiration4 crew (3-day orbital flight, Sept 2021). Samples at 92, 44 and 3 days before launch (L-) and 1, 45, 82 and 194 days after return (R+). Crew IDs are anonymised as in the original data.
      </div>

      <div className="grid g3 mb">
        <div className="card"><div className="upper">Personal baseline finds more</div><div className="num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{personalOnly}</div>
          <div className="small muted">day-after-landing changes that are <b>outside the person's own normal</b> but still inside the lab's population range: missed by standard reports, caught by PRANA. (Lab-range flags: {labFlags}.)</div></div>
        <div className="card"><div className="upper">Blood sugar after landing</div><div className="num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--amber)' }}>+{Math.round(gl.reduce((a, b) => a + b, 0) / 4)}%</div>
          <div className="small muted">average rise in glucose at R+1 vs each crew member's own pre-flight mean (range +{Math.round(Math.min(...gl))}% to +{Math.round(Math.max(...gl))}%). Only one of these readings is outside the lab range, so the shift is visible only against each person's own baseline.</div></div>
        <div className="card"><div className="upper">Check before you act</div><div className="num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--watch)' }}>{lowR45}/4</div>
          <div className="small muted">crew had glucose &lt; 54 mg/dL at R+45, all at once and without reported symptoms. PRANA's rule: an implausible single value → <b>retest first</b> (it may come from sample handling), so the crew doesn't act on a bad reading.</div></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <div className="card">
          <div className="row between wrap mb">
            <select className="input" style={{ width: 'auto' }} value={k} onChange={(e) => setK(e.target.value)}>
              {Object.entries(I4_MARKERS).map(([key, m]) => <option key={key} value={key}>{m.name}</option>)}
            </select>
            <div className="seg">{CREWS.map((c, i) => <button key={c} className={crew === c ? 'on' : ''} onClick={() => setCrew(c)} style={{ color: crew === c ? COLORS[i] : undefined }}>{c}</button>)}</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rows} margin={{ top: 10, right: 16, left: -6, bottom: 0 }}>
              <CartesianGrid stroke="#1f2c45" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              {mk.min != null && mk.max != null && <ReferenceArea y1={mk.min} y2={mk.max} fill="#8fa0bb" fillOpacity={0.06} />}
              <ReferenceArea y1={pb.mean - 2 * pb.sd} y2={pb.mean + 2 * pb.sd} fill="#5eead4" fillOpacity={0.14} />
              <ReferenceLine x="R+1" stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'landing', fill: '#fbbf24', fontSize: 10, position: 'insideTopLeft' }} />
              <Tooltip formatter={(v) => `${v} ${mk.unit}`} />
              {CREWS.map((c, i) => <Line key={c} dataKey={c} stroke={COLORS[i]} strokeWidth={c === crew ? 3 : 1.2} strokeOpacity={c === crew ? 1 : 0.35} dot={{ r: c === crew ? 4 : 2 }} isAnimationActive={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
          <div className="tiny dim">Grey band = lab reference range ({mk.min}–{mk.max} {mk.unit}) · teal band = {crew}'s personal pre-flight normal ({(pb.mean - 2 * pb.sd).toFixed(1)}–{(pb.mean + 2 * pb.sd).toFixed(1)}) · thick line = selected crew member</div>
        </div>
        <div className="card">
          <h3>Day after landing (R+1) vs own baseline</h3>
          <div style={{ overflow: 'auto', maxHeight: 340 }}>
            <table className="data mt">
              <thead><tr><th>Marker</th>{CREWS.map((c) => <th key={c} className="num">{c}</th>)}</tr></thead>
              <tbody>{r1.map((row) => (
                <tr key={row.key} style={{ cursor: 'pointer', background: row.key === k ? 'rgba(94,234,212,0.06)' : undefined }} onClick={() => setK(row.key)}>
                  <td className="small">{row.M.name}</td>
                  {row.cells.map((c, i) => <td key={i} className="num small" style={{ color: !c ? undefined : c.outLab ? 'var(--red)' : c.outPersonal ? 'var(--amber)' : 'var(--muted)' }}>{c ? `${c.pct > 0 ? '+' : ''}${c.pct.toFixed(0)}%` : '–'}</td>)}
                </tr>))}
              </tbody>
            </table>
          </div>
          <p className="tiny dim mt"><span style={{ color: 'var(--amber)' }}>amber</span> = outside personal normal (±2 SD of 3 pre-flight samples) · <span style={{ color: 'var(--red)' }}>red</span> = outside lab range · tap a row to chart it. Small sample (n = 4, 3-day flight): shown to demonstrate the method, not to draw clinical conclusions.</p>
        </div>
      </div>
    </div>
  );
}
