import { Area, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../lib/store';
import { HAZARDS, LEVEL_LABEL, METRICS, PLAYBOOK, type MetricKey } from '../lib/knowledge';
import { STATUS_COLOR, STATUS_LABEL, type Status } from '../lib/engine';

export function StatusPill({ s }: { s: Status }) {
  return <span className="pill" style={{ color: STATUS_COLOR[s] }}><span className="dot" style={{ background: STATUS_COLOR[s] }} />{STATUS_LABEL[s]}</span>;
}

export function fmtVal(k: MetricKey, x: number) {
  return x.toFixed(METRICS[k].decimals);
}

/** Metric history chart: values, personal-baseline band, safety limits, current day marker. */
export function MetricChart({ k, height = 220, window = 180, compact = false }: { k: MetricKey; height?: number; window?: number; compact?: boolean }) {
  const { records, day, a } = useApp();
  const m = METRICS[k];
  const ev = a.metrics[k];
  const from = Math.max(records[0].day, day - window);
  const rows = records.filter((r) => r.day >= from && r.day <= day).map((r) => ({ day: r.day, v: +r.v[k].toFixed(3) }));
  // 7-day rolling mean
  rows.forEach((r, i) => {
    const s = rows.slice(Math.max(0, i - 6), i + 1);
    (r as { avg?: number }).avg = +(s.reduce((a, b) => a + b.v, 0) / s.length).toFixed(3);
  });
  const showBand = !['co2', 'dose', 'bone', 'vision', 'symptoms', 'exercise'].includes(k);
  const lo = ev.baseline.mean - 2 * ev.baseline.sd, hi = ev.baseline.mean + 2 * ev.baseline.sd;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: compact ? -24 : -8 }}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={30} hide={compact} />
        <YAxis tickLine={false} axisLine={false} domain={['auto', 'auto']} width={compact ? 30 : 48} hide={compact} />
        {showBand && <ReferenceArea y1={lo} y2={hi} fill="#5eead4" fillOpacity={0.08} stroke="none" ifOverflow="extendDomain" />}
        {m.highAmber !== undefined && <ReferenceLine y={m.highAmber} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.6} />}
        {m.lowAmber !== undefined && <ReferenceLine y={m.lowAmber} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.6} />}
        {m.highRed !== undefined && !compact && <ReferenceLine y={m.highRed} stroke="#f87171" strokeDasharray="2 4" strokeOpacity={0.6} />}
        {m.lowRed !== undefined && !compact && <ReferenceLine y={m.lowRed} stroke="#f87171" strokeDasharray="2 4" strokeOpacity={0.6} />}
        <ReferenceLine x={0} stroke="#2b3b5a" label={compact ? undefined : { value: 'launch', fill: '#5d6e8a', fontSize: 10, position: 'insideTopLeft' }} />
        {!compact && <Tooltip formatter={(v) => `${Number(v).toFixed(m.decimals || 1)} ${m.unit}`} labelFormatter={(d) => `Mission day ${d}`} />}
        <Area dataKey="v" stroke="none" fill={STATUS_COLOR[ev.status]} fillOpacity={0.07} isAnimationActive={false} />
        <Line dataKey="v" stroke="#8fa0bb" strokeOpacity={0.45} dot={false} strokeWidth={1} isAnimationActive={false} name="Daily" />
        <Line dataKey="avg" stroke={STATUS_COLOR[ev.status]} dot={false} strokeWidth={2.2} isAnimationActive={false} name="7-day avg" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Explanation drawer for one metric: value, why flagged, how to measure, what to do. */
export function MetricModal() {
  const { focusMetric: k, setFocusMetric, a, setTab } = useApp();
  if (!k) return null;
  const m = METRICS[k];
  const ev = a.metrics[k];
  const hz = HAZARDS.find((h) => h.id === m.hazard)!;
  return (
    <div className="modal-bg" onClick={() => setFocusMetric(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div>
            <div className="upper">{hz.icon} {hz.name}</div>
            <h2>{m.name}</h2>
          </div>
          <button className="btn ghost" onClick={() => setFocusMetric(null)}>Close ✕</button>
        </div>
        <div className="row wrap mt" style={{ gap: 18 }}>
          <div><div className="upper">Today</div><span className="num" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{fmtVal(k, ev.value)}</span> <span className="muted">{m.unit}</span></div>
          <div><div className="upper">7-day avg</div><span className="num" style={{ fontSize: '1.2rem' }}>{fmtVal(k, ev.avg7)}</span></div>
          {!['co2', 'dose', 'bone', 'vision', 'symptoms', 'exercise'].includes(k) && <div><div className="upper">Your normal</div><span className="num" style={{ fontSize: '1.2rem' }}>{fmtVal(k, ev.baseline.mean - 2 * ev.baseline.sd)}–{fmtVal(k, ev.baseline.mean + 2 * ev.baseline.sd)}</span></div>}
          <div style={{ marginLeft: 'auto' }}><StatusPill s={ev.status} /></div>
        </div>
        <div className="mt"><MetricChart k={k} height={200} /></div>
        <div className="small dim">Grey = daily reading · coloured line = 7-day average · teal band = YOUR pre-flight normal (±2 SD) · dashed = caution / safety limits</div>

        <div className="card mt" style={{ background: 'var(--bg2)' }}>
          <h3>Why am I seeing this?</h3>
          {ev.reasons.length ? <ul className="muted small" style={{ paddingLeft: 18, margin: '6px 0 0' }}>{ev.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            : <p className="muted small">Everything is within your personal normal range and the safety limits. Keep doing what you're doing.</p>}
        </div>
        <div className="grid g2 mt">
          <div><h3>Why it matters in space</h3><p className="muted small">{m.why}</p></div>
          <div><h3>How to measure</h3><p className="muted small">{m.how}</p>
            {(k === 'pvt' || k === 'vision') && <button className="btn mt" onClick={() => { setFocusMetric(null); setTab('tests'); }}>Open the test →</button>}
          </div>
        </div>
        <h3 className="mt">What you can do</h3>
        <div className="actions">
          {PLAYBOOK[k].map((x, i) => (
            <div className="action" key={i} style={{ gridTemplateColumns: '1fr auto' }}>
              <div><b>{x.title}</b><div className="muted small">{x.detail}</div></div>
              <span className={`lvl ${x.level}`}>{LEVEL_LABEL[x.level]}</span>
            </div>
          ))}
        </div>
        <p className="tiny dim mt">Reference: {m.source}</p>
      </div>
    </div>
  );
}

export function Ring({ value, color, size = 168, stroke = 14 }: { value: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2c45" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s' }} />
    </svg>
  );
}

export function SimTag() { return <span className="tag sim" title="Synthetic data generated from published spaceflight rates">SIMULATED crew data</span>; }
export function RealTag() { return <span className="tag real">REAL NASA data</span>; }
