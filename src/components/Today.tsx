import { useState } from 'react';
import { useApp } from '../lib/store';
import { HAZARDS, LEVEL_LABEL, METRICS, type HazardId, type MetricKey } from '../lib/knowledge';
import { STATUS_COLOR, type Status } from '../lib/engine';
import { MISSIONS, fmtDelay } from '../lib/missions';
import { CREW } from '../lib/generate';
import { MetricChart, Ring, SimTag, StatusPill, fmtVal } from './ui';

const VITALS: MetricKey[] = ['sbp', 'hr', 'glucose', 'temp', 'sleep', 'mood'];

export function readinessColor(n: number) {
  return n >= 85 ? 'var(--ok)' : n >= 70 ? 'var(--amber)' : 'var(--red)';
}

export default function Today() {
  const { a, day, mission, crewId, setFocusMetric, progress, toggleDone, setTab } = useApp();
  const [openHazard, setOpenHazard] = useState<HazardId | null>(null);
  const M = MISSIONS[mission];
  const crew = CREW.find((c) => c.id === crewId)!;
  const urgent = a.alerts.filter((x) => x.status === 'red' || x.status === 'amber');
  const headline = a.status === 'red' ? 'Act on the red items below today.' : a.status === 'amber' ? 'A few things need attention.' : a.status === 'watch' ? 'Good: some trends to keep an eye on.' : 'All systems nominal. Great work.';

  return (
    <div>
      <div className="section-head">
        <div>
          <div className="upper">Mission day {day} · {M.name}</div>
          <h2>Good morning, {crew.name.split(' ').slice(-2, -1)[0] ?? crew.name}.</h2>
        </div>
        <SimTag />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)' }}>
        <div className="card pad-lg row" style={{ gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="ring-wrap">
            <Ring value={a.readiness} color={readinessColor(a.readiness)} />
            <div className="center"><div><div className="big" style={{ color: readinessColor(a.readiness) }}>{a.readiness}</div><div className="upper" style={{ marginTop: 4 }}>Readiness</div></div></div>
          </div>
          <div className="stack" style={{ flex: 1, minWidth: 200 }}>
            <StatusPill s={a.status} />
            <h3 style={{ fontSize: '1.15rem' }}>{headline}</h3>
            <div className="muted small">Your score combines {Object.keys(METRICS).length} health indicators, each compared with <b>your own</b> pre-flight normal and with NASA safety limits.</div>
            <div className="row wrap small" style={{ gap: 16 }}>
              <span><span className="dim">Earth link</span> <b className="num">{fmtDelay(M.delay(day))}</b></span>
              <span><span className="dim">Gravity</span> <b>{M.gravityLabel}</b></span>
              <span><span className="dim">Mission dose</span> <b className="num">{a.cumDose.toFixed(0)} mSv</b></span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row between mb"><h3>Today's priorities</h3><span className="tiny dim">{urgent.length} need action</span></div>
          {a.alerts.length === 0 && <p className="muted">Nothing needs action today. Complete your routine to keep your streak going.</p>}
          <div className="stack">
            {a.alerts.slice(0, 4).map((al) => (
              <button key={al.key} className="tile row" style={{ gap: 12 }} onClick={() => setFocusMetric(al.key)}>
                <span className="dot" style={{ background: STATUS_COLOR[al.status], width: 11, height: 11 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{al.title} <span className="muted small num">· {fmtVal(al.key, a.metrics[al.key].value)} {METRICS[al.key].unit}</span></div>
                  <div className="muted small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>→ {al.actions[0]?.title}</div>
                </div>
                <span className="link">Why?</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="upper mt mb" style={{ marginTop: 22 }}>The five hazards of human spaceflight</div>
      <div className="grid g5">
        {a.hazards.map((h) => {
          const H = HAZARDS.find((x) => x.id === h.id)!;
          return (
            <div key={h.id} className="card hazard" onClick={() => setOpenHazard(openHazard === h.id ? null : h.id)}>
              <div className="bar" style={{ background: STATUS_COLOR[h.status] }} />
              <div className="row between"><div className="icon">{H.icon}</div><span className="score" style={{ color: STATUS_COLOR[h.status] }}>{h.score}</span></div>
              <h3 className="mt" style={{ marginTop: 10 }}>{H.short}</h3>
              <div className="row wrap" style={{ gap: 5, marginTop: 8 }}>
                {h.metrics.map((e) => <span key={e.key} title={METRICS[e.key].name} className="dot" style={{ background: STATUS_COLOR[e.status] }} />)}
              </div>
              <div className="tiny dim" style={{ marginTop: 6 }}>{h.metrics.length} indicators · tap for detail</div>
            </div>
          );
        })}
      </div>
      {openHazard && <HazardDetail id={openHazard} />}

      <div className="grid mt" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', marginTop: 16 }}>
        <div className="card">
          <div className="row between mb"><h3>Act: your countermeasure plan</h3><span className="tiny dim">tick when done · +10 XP each</span></div>
          {a.alerts.length === 0 && <p className="muted small">No countermeasures needed today.</p>}
          <div className="stack">
            {a.alerts.slice(0, 5).map((al) => (
              <div key={al.key} className="alert" style={{ borderColor: STATUS_COLOR[al.status] }}>
                <div className="row between"><b>{al.title}</b><StatusPill s={al.status} /></div>
                <ul>{al.reasons.slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}</ul>
                <div className="actions">
                  {al.actions.map((x, i) => {
                    const id = `${mission}:${crewId}:${day}:${al.key}:${i}`;
                    const done = !!progress.done[id];
                    return (
                      <label key={i} className={`action ${done ? 'done' : ''}`}>
                        <input type="checkbox" checked={done} onChange={() => toggleDone(id)} />
                        <div><b>{x.title}</b><div className="muted small">{x.detail}</div></div>
                        <span className={`lvl ${x.level}`}>{LEVEL_LABEL[x.level]}</span>
                      </label>
                    );
                  })}
                </div>
                {al.actions.some((x) => x.level === 'ground') && <button className="link" style={{ marginTop: 8 }} onClick={() => setTab('comms')}>Send to flight surgeon (with delay) →</button>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="row between mb"><h3>Key vitals</h3><button className="link" onClick={() => setTab('checkin')}>Log today's values →</button></div>
          <div className="grid g2" style={{ gap: 10 }}>
            {VITALS.map((k) => {
              const e = a.metrics[k];
              return (
                <button key={k} className="tile" onClick={() => setFocusMetric(k)} style={{ borderColor: e.status === 'ok' ? undefined : STATUS_COLOR[e.status as Status] }}>
                  <div className="row between"><span className="small muted">{METRICS[k].name.replace(' (systolic)', '')}</span><span className="dot" style={{ background: STATUS_COLOR[e.status] }} /></div>
                  <div><span className="v">{k === 'sbp' ? `${fmtVal('sbp', e.value)}/${fmtVal('dbp', a.metrics.dbp.value)}` : fmtVal(k, e.value)}</span><span className="u">{METRICS[k].unit}</span></div>
                  <div style={{ height: 36 }}><MetricChart k={k} height={36} window={30} compact /></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HazardDetail({ id }: { id: HazardId }) {
  const { a, setFocusMetric } = useApp();
  const H = HAZARDS.find((x) => x.id === id)!;
  const h = a.hazards.find((x) => x.id === id)!;
  return (
    <div className="card mt" style={{ borderColor: STATUS_COLOR[h.status] }}>
      <div className="row between"><h3>{H.icon} {H.name}</h3><StatusPill s={h.status} /></div>
      <p className="muted small">{H.blurb}</p>
      <div className="row wrap small" style={{ gap: 6 }}>{H.risks.map((r) => <span key={r} className="tag">{r}</span>)}</div>
      <div className="grid g3 mt">
        {h.metrics.map((e) => (
          <button key={e.key} className="tile" onClick={() => setFocusMetric(e.key)}>
            <div className="row between"><span className="small">{METRICS[e.key].name}</span><StatusPill s={e.status} /></div>
            <span className="v">{fmtVal(e.key, e.value)}</span><span className="u">{METRICS[e.key].unit}</span>
          </button>
        ))}
      </div>
      <p className="tiny dim mt">Source: NASA Human Research Program, "5 Hazards of Human Spaceflight"</p>
    </div>
  );
}
