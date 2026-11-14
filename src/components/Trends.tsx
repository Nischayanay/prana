import { useState } from 'react';
import { useApp } from '../lib/store';
import { HAZARDS, METRICS, type HazardId, type MetricKey } from '../lib/knowledge';
import { MetricChart, SimTag, StatusPill, fmtVal } from './ui';

export default function Trends() {
  const { a, setFocusMetric } = useApp();
  const [hz, setHz] = useState<HazardId | 'all'>('all');
  const [win, setWin] = useState(180);
  const keys = (Object.keys(METRICS) as MetricKey[]).filter((k) => hz === 'all' || METRICS[k].hazard === hz);
  return (
    <div>
      <div className="section-head">
        <div><div className="upper">Health over time</div><h2>Trends vs. your personal normal</h2></div>
        <div className="row wrap"><SimTag />
          <div className="seg">{[30, 90, 180].map((w) => <button key={w} className={win === w ? 'on' : ''} onClick={() => setWin(w)}>{w} d</button>)}</div>
        </div>
      </div>
      <div className="seg mb">
        <button className={hz === 'all' ? 'on' : ''} onClick={() => setHz('all')}>All</button>
        {HAZARDS.map((h) => <button key={h.id} className={hz === h.id ? 'on' : ''} onClick={() => setHz(h.id)}>{h.icon} {h.short}</button>)}
      </div>
      <div className="grid g2">
        {keys.map((k) => {
          const e = a.metrics[k];
          return (
            <div key={k} className="card" style={{ cursor: 'pointer' }} onClick={() => setFocusMetric(k)}>
              <div className="row between">
                <div><h3>{METRICS[k].name}</h3><span className="num" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmtVal(k, e.value)}</span> <span className="muted small">{METRICS[k].unit}</span></div>
                <StatusPill s={e.status} />
              </div>
              <MetricChart k={k} height={150} window={win} />
              <div className="small muted" style={{ minHeight: 20 }}>{e.reasons[0] ?? 'Within your normal range.'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
