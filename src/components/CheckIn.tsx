import { useState } from 'react';
import { useApp } from '../lib/store';
import { METRICS, type MetricKey } from '../lib/knowledge';
import { STATUS_COLOR } from '../lib/engine';
import { StatusPill, fmtVal } from './ui';

const NUMERIC: { k: MetricKey; step: number }[] = [
  { k: 'sbp', step: 1 }, { k: 'dbp', step: 1 }, { k: 'hr', step: 1 }, { k: 'temp', step: 0.1 },
  { k: 'glucose', step: 1 }, { k: 'spo2', step: 1 }, { k: 'sleep', step: 0.25 }, { k: 'exercise', step: 5 },
];
const SYMPTOMS = ['Cold sores', 'Skin rash', 'Sore throat', 'Fever / chills', 'Slow-healing cut', 'Unusual fatigue', 'Headache', 'Blurred vision'];

export default function CheckIn() {
  const { a, logValues, entered, day, setFocusMetric, setTab, progress, toggleDone, mission, crewId } = useApp();
  const init = () => Object.fromEntries(NUMERIC.map(({ k }) => [k, +fmtVal(k, a.metrics[k].value)])) as Record<MetricKey, number>;
  const [vals, setVals] = useState<Record<string, number>>(init);
  const [mood, setMood] = useState(Math.round(a.metrics.mood.value));
  const [stress, setStress] = useState(Math.round(a.metrics.stress.value));
  const [sym, setSym] = useState<string[]>([]);
  const [how, setHow] = useState<MetricKey | null>(null);
  const [saved, setSaved] = useState(false);
  const symptomCount = sym.filter((s) => !['Headache', 'Blurred vision'].includes(s)).length;

  const save = () => {
    // only store what the astronaut actually changed; sensor values stay as they are
    const changed: Record<string, number> = {};
    NUMERIC.forEach(({ k }) => { if (vals[k] !== +fmtVal(k, a.metrics[k].value)) changed[k] = vals[k]; });
    if (mood !== Math.round(a.metrics.mood.value)) changed.mood = mood;
    if (stress !== Math.round(a.metrics.stress.value)) changed.stress = stress;
    if (symptomCount !== a.metrics.symptoms.value) changed.symptoms = symptomCount;
    logValues(changed);
    const id = `checkin:${mission}:${crewId}:${day}`;
    if (!progress.done[id]) toggleDone(id, 20);
    setSaved(true);
  };

  return (
    <div>
      <div className="section-head">
        <div><div className="upper">Daily check-in · mission day {day}</div><h2>How are you today?</h2></div>
        <span className="tag">Stored on this device only. You choose what is shared.</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)' }}>
        <div className="card pad-lg">
          <h3>Vitals</h3>
          <p className="muted small">Pre-filled from your sensors. Correct anything that's wrong, or enter a manual reading. Tap <b>?</b> for how to measure.</p>
          <div className="grid g2 mt">
            {NUMERIC.map(({ k, step }) => (
              <div className="field" key={k}>
                <label className="row between"><span>{METRICS[k].name} <span className="dim">({METRICS[k].unit})</span></span>
                  <button className="link" onClick={() => setHow(how === k ? null : k)}>?</button></label>
                <input className="input num" type="number" step={step} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: parseFloat(e.target.value) || 0 })} />
                {how === k && <div className="small muted" style={{ background: 'var(--bg2)', padding: 8, borderRadius: 8 }}>{METRICS[k].how}</div>}
              </div>
            ))}
          </div>

          <h3 className="mt" style={{ marginTop: 22 }}>Mind</h3>
          <div className="grid g2 mt">
            <div className="field"><label className="row between"><span>Mood</span><b className="num">{mood}/10</b></label>
              <input type="range" min={1} max={10} value={mood} onChange={(e) => setMood(+e.target.value)} />
              <div className="row between tiny dim"><span>very low</span><span>excellent</span></div></div>
            <div className="field"><label className="row between"><span>Stress</span><b className="num">{stress}/10</b></label>
              <input type="range" min={1} max={10} value={stress} onChange={(e) => setStress(+e.target.value)} />
              <div className="row between tiny dim"><span>calm</span><span>overwhelmed</span></div></div>
          </div>

          <h3 className="mt" style={{ marginTop: 22 }}>Any symptoms?</h3>
          <div className="grid g2 mt" style={{ gap: 8 }}>
            {SYMPTOMS.map((s) => (
              <label key={s} className={`chk ${sym.includes(s) ? 'on' : ''}`}>
                <input type="checkbox" checked={sym.includes(s)} onChange={() => setSym(sym.includes(s) ? sym.filter((x) => x !== s) : [...sym, s])} />{s}
              </label>
            ))}
          </div>
          {sym.includes('Blurred vision') && <div className="banner info mt">👁 Blurred vision can be an early sign of SANS. <button className="link" onClick={() => setTab('tests')}>Take the Amsler vision test →</button></div>}
          {sym.includes('Headache') && <div className="banner info mt">Headache + high cabin CO₂ ({a.metrics.co2.value.toFixed(1)} mmHg today) are linked. Move to a ventilated area.</div>}

          <div className="row mt" style={{ marginTop: 20 }}>
            <button className="btn primary" onClick={save}>Save check-in (+20 XP)</button>
            {saved && <span className="small" style={{ color: 'var(--ok)' }}>✓ Saved. Your assessment has been updated.</span>}
          </div>
        </div>

        <div className="card">
          <h3>Live assessment</h3>
          <p className="muted small">Updates as soon as you save. Each value is checked against safety limits and against <b>your own</b> normal.</p>
          <div className="stack mt">
            {(['sbp', 'dbp', 'hr', 'temp', 'glucose', 'spo2', 'sleep', 'mood', 'stress', 'symptoms'] as MetricKey[]).map((k) => {
              const e = a.metrics[k];
              return (
                <button key={k} className="tile row between" onClick={() => setFocusMetric(k)} style={{ padding: '8px 12px', borderColor: e.status === 'ok' ? undefined : STATUS_COLOR[e.status] }}>
                  <span className="small">{METRICS[k].name} {entered[k] !== undefined && <span className="tag" style={{ marginLeft: 6 }}>you entered</span>}</span>
                  <span className="row" style={{ gap: 10 }}><b className="num">{fmtVal(k, e.value)}</b><StatusPill s={e.status} /></span>
                </button>
              );
            })}
          </div>
          <p className="tiny dim mt">Try it: enter a blood pressure of 165/102 or a temperature of 38.5 and save.</p>
        </div>
      </div>
    </div>
  );
}
