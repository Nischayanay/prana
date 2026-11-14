import { useState } from 'react';
import { useApp } from '../lib/store';
import { METRICS, ORGANS, type OrganId } from '../lib/knowledge';
import { STATUS_COLOR, type Status } from '../lib/engine';
import { StatusPill, fmtVal } from './ui';

const RANK: Record<Status, number> = { ok: 0, watch: 1, amber: 2, red: 3 };

/** Clickable human figure: each body system coloured by its worst indicator. */
export default function BodyMap() {
  const { a, setFocusMetric } = useApp();
  const [sel, setSel] = useState<OrganId>('heart');
  const statusOf = (o: OrganId): Status => ORGANS[o].metrics.reduce<Status>((s, k) => (RANK[a.metrics[k].status] > RANK[s] ? a.metrics[k].status : s), 'ok');
  const col = (o: OrganId) => STATUS_COLOR[statusOf(o)];
  const P = (o: OrganId) => ({
    className: `part ${sel === o ? 'sel' : ''}`, onClick: () => setSel(o),
    role: 'button', 'aria-label': ORGANS[o].name, tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') setSel(o); },
  });
  const organ = ORGANS[sel];
  const st = statusOf(sel);

  return (
    <div>
      <div className="section-head"><div><div className="upper">Body status</div><h2>Tap a body system</h2></div>
        <div className="row small muted" style={{ gap: 12 }}>{(['ok', 'watch', 'amber', 'red'] as Status[]).map((s) => <span key={s} className="row" style={{ gap: 5 }}><span className="dot" style={{ background: STATUS_COLOR[s] }} />{{ ok: 'Nominal', watch: 'Watch', amber: 'Caution', red: 'Act now' }[s]}</span>)}</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(260px, 380px) 1fr' }}>
        <div className="card bodymap" style={{ display: 'grid', placeItems: 'center' }}>
          <svg viewBox="0 0 300 560" width="100%" style={{ maxWidth: 330 }}>
            <defs>
              <radialGradient id="aura" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor={col('immune')} stopOpacity="0.16" /><stop offset="1" stopColor={col('immune')} stopOpacity="0" /></radialGradient>
            </defs>
            {/* immune aura (whole body) */}
            <ellipse cx="150" cy="280" rx="148" ry="275" fill="url(#aura)" {...P('immune')} />
            {/* silhouette */}
            <g fill="#16233a" stroke="#2b3b5a" strokeWidth="1.5">
              <circle cx="150" cy="62" r="40" />
              <rect x="136" y="98" width="28" height="22" rx="6" />
              <path d="M92 124 Q150 108 208 124 L222 300 Q150 318 78 300 Z" />
              <path d="M92 128 L58 250 L44 360 L62 364 L84 262 L104 170 Z" />
              <path d="M208 128 L242 250 L256 360 L238 364 L216 262 L196 170 Z" />
              <path d="M84 300 L80 420 L92 540 L130 540 L140 420 L150 330 L160 420 L170 540 L208 540 L220 420 L216 300 Q150 318 84 300 Z" />
            </g>
            {/* brain */}
            <path d="M118 52 Q120 26 150 24 Q180 26 182 52 Q170 46 150 48 Q130 46 118 52 Z" fill={col('brain')} opacity="0.9" {...P('brain')} />
            {/* eyes */}
            <g {...P('eyes')}><ellipse cx="136" cy="66" rx="8" ry="5" fill={col('eyes')} /><ellipse cx="164" cy="66" rx="8" ry="5" fill={col('eyes')} /></g>
            {/* lungs */}
            <g {...P('lungs')} opacity="0.85"><path d="M112 140 Q100 190 108 228 L138 222 L140 146 Z" fill={col('lungs')} /><path d="M188 140 Q200 190 192 228 L162 222 L160 146 Z" fill={col('lungs')} /></g>
            {/* heart */}
            <path d="M150 196 C140 184 124 186 126 200 C128 212 150 224 150 224 C150 224 172 212 174 200 C176 186 160 184 150 196 Z" fill={col('heart')} {...P('heart')} />
            {/* metabolism (stomach) */}
            <ellipse cx="150" cy="262" rx="30" ry="20" fill={col('metabolism')} opacity="0.85" {...P('metabolism')} />
            {/* muscles: arms and thighs */}
            <g {...P('muscles')} opacity="0.8">
              <path d="M78 170 L62 250 L76 254 L94 180 Z" fill={col('muscles')} />
              <path d="M222 170 L238 250 L224 254 L206 180 Z" fill={col('muscles')} />
              <path d="M98 330 L94 410 L130 410 L138 340 Z" fill={col('muscles')} />
              <path d="M202 330 L206 410 L170 410 L162 340 Z" fill={col('muscles')} />
            </g>
            {/* bones: hip + shins */}
            <g {...P('bones')}>
              <path d="M104 296 Q150 284 196 296 L190 316 Q150 306 110 316 Z" fill={col('bones')} />
              <rect x="104" y="430" width="14" height="96" rx="6" fill={col('bones')} />
              <rect x="182" y="430" width="14" height="96" rx="6" fill={col('bones')} />
            </g>
          </svg>
          <div className="tiny dim">Outer glow = immune system</div>
        </div>

        <div className="card pad-lg">
          <div className="row between"><h2>{organ.name}</h2><StatusPill s={st} /></div>
          <p className="muted">{organ.blurb}</p>
          <div className="stack mt">
            {organ.metrics.map((k) => {
              const e = a.metrics[k];
              return (
                <button key={k} className="tile row between" onClick={() => setFocusMetric(k)} style={{ borderColor: e.status === 'ok' ? undefined : STATUS_COLOR[e.status] }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{METRICS[k].name}</div>
                    <div className="muted small">{e.reasons[0] ?? 'Within your normal range.'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none', marginLeft: 12 }}>
                    <span className="v">{fmtVal(k, e.value)}</span><span className="u">{METRICS[k].unit}</span>
                    <div><StatusPill s={e.status} /></div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="tiny dim mt">Tap any indicator for the explanation, how to measure it and what to do.</p>
          <div className="grid g3 mt">
            {(Object.keys(ORGANS) as OrganId[]).map((o) => (
              <button key={o} className={`chk ${sel === o ? 'on' : ''}`} onClick={() => setSel(o)}><span className="dot" style={{ background: col(o) }} />{ORGANS[o].name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
