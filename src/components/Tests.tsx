import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { StatusPill } from './ui';

export default function Tests() {
  const [t, setT] = useState<'pvt' | 'amsler'>('pvt');
  return (
    <div>
      <div className="section-head">
        <div><div className="upper">Self-tests</div><h2>Check your brain and eyes in 3 minutes</h2></div>
        <div className="seg"><button className={t === 'pvt' ? 'on' : ''} onClick={() => setT('pvt')}>⚡ Reaction test (PVT)</button><button className={t === 'amsler' ? 'on' : ''} onClick={() => setT('amsler')}>👁 Vision test (Amsler)</button></div>
      </div>
      {t === 'pvt' ? <PVT /> : <Amsler />}
    </div>
  );
}

type Phase = 'idle' | 'wait' | 'go' | 'done';

function PVT() {
  const { a, logValues, toggleDone, progress, mission, crewId, day } = useApp();
  const [dur, setDur] = useState(30);
  const [phase, setPhase] = useState<Phase>('idle');
  const [rts, setRts] = useState<number[]>([]);
  const [falseStarts, setFalse] = useState(0);
  const [shown, setShown] = useState(0);
  const [msg, setMsg] = useState('');
  const t0 = useRef(0), end = useRef(0), timer = useRef<number | undefined>(undefined), raf = useRef(0);

  const schedule = () => {
    if (performance.now() > end.current) { setPhase('done'); return; }
    setPhase('wait');
    const isi = (dur <= 30 ? 1000 + Math.random() * 3000 : 2000 + Math.random() * 4000);
    timer.current = window.setTimeout(() => {
      t0.current = performance.now(); setPhase('go');
      const tick = () => { setShown(Math.round(performance.now() - t0.current)); raf.current = requestAnimationFrame(tick); };
      tick();
    }, isi);
  };
  const start = () => { setRts([]); setFalse(0); setMsg(''); end.current = performance.now() + dur * 1000; schedule(); };
  const hit = () => {
    if (phase === 'wait') { clearTimeout(timer.current); setFalse((f) => f + 1); setMsg('Too early! Wait for the counter.'); schedule(); }
    else if (phase === 'go') {
      cancelAnimationFrame(raf.current);
      const rt = performance.now() - t0.current;
      setRts((r) => [...r, rt]); setMsg(`${Math.round(rt)} ms`);
      setTimeout(schedule, 700);
      setPhase('wait');
    }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' && (phase === 'wait' || phase === 'go')) { e.preventDefault(); hit(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current); }, []);

  const mean = rts.length ? rts.reduce((x, y) => x + y, 0) / rts.length : 0;
  const lapses = rts.filter((r) => r > 500).length;
  const base = a.metrics.pvt.baseline.mean;
  const slower = mean - base;
  const verdict = !rts.length ? null : slower > 60 || lapses >= 3 ? 'red' : slower > 30 || lapses >= 1 ? 'amber' : 'ok';

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
      <div className="card pad-lg">
        <div className="row between mb">
          <h3>Psychomotor Vigilance Test</h3>
          <div className="seg">{[30, 180].map((d) => <button key={d} disabled={phase === 'wait' || phase === 'go'} className={dur === d ? 'on' : ''} onClick={() => setDur(d)}>{d === 30 ? '30 s demo' : '3 min (standard)'}</button>)}</div>
        </div>
        <div className="pvt-area" onMouseDown={hit} onTouchStart={(e) => { e.preventDefault(); hit(); }}>
          {phase === 'idle' && <div style={{ textAlign: 'center' }}><p className="muted">When a red counter appears, tap here (or press <b>Space</b>) as fast as you can.</p><button className="btn primary mt" onMouseDown={(e) => e.stopPropagation()} onClick={start}>Start test</button></div>}
          {phase === 'wait' && <div className="muted" style={{ textAlign: 'center' }}><div style={{ fontSize: '1.4rem' }}>+</div><div className="small">{msg}</div></div>}
          {phase === 'go' && <div className="pvt-counter">{shown}</div>}
          {phase === 'done' && <div style={{ textAlign: 'center' }}><h3>Test complete</h3><p className="muted">{rts.length} responses</p><button className="btn mt" onMouseDown={(e) => e.stopPropagation()} onClick={start}>Run again</button></div>}
        </div>
        <p className="tiny dim mt">The PVT is the standard fatigue test in sleep and spaceflight research (NASA's "Cognition" battery includes it). Reactions over 500 ms count as lapses.</p>
      </div>
      <div className="card pad-lg">
        <h3>Your result</h3>
        <div className="grid g3 mt">
          <div><div className="upper">Mean</div><div className="num" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{rts.length ? Math.round(mean) : '–'}</div><div className="tiny dim">ms</div></div>
          <div><div className="upper">Lapses</div><div className="num" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{lapses}</div><div className="tiny dim">&gt; 500 ms</div></div>
          <div><div className="upper">False starts</div><div className="num" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{falseStarts}</div></div>
        </div>
        <div className="mt small muted">Your pre-flight normal: <b className="num">{Math.round(base)} ms</b></div>
        {verdict && phase === 'done' && (
          <div className="alert mt" style={{ borderColor: verdict === 'ok' ? 'var(--ok)' : verdict === 'amber' ? 'var(--amber)' : 'var(--red)' }}>
            <StatusPill s={verdict as 'ok'} />
            <p className="small" style={{ marginTop: 8 }}>
              {verdict === 'ok' ? 'You are as alert as before launch. Cleared for critical tasks.' :
                verdict === 'amber' ? `You are ${Math.round(slower)} ms slower than your normal. Consider a 20-min nap before critical tasks.` :
                  `Significant fatigue (${Math.round(slower)} ms slower, ${lapses} lapses). Avoid robotic arm, docking or EVA prep and tell your commander.`}
            </p>
            <button className="btn primary mt" onClick={() => {
              logValues({ pvt: Math.round(mean) });
              const id = `pvt:${mission}:${crewId}:${day}`; if (!progress.done[id]) toggleDone(id, 25);
              setMsg('saved');
            }}>Save to my record (+25 XP)</button>
            {msg === 'saved' && <span className="small" style={{ color: 'var(--ok)', marginLeft: 10 }}>✓ Saved</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function zonesOf(marked: Set<number>, n: number) {
  const seen = new Set<number>(); let zones = 0;
  for (const c of marked) {
    if (seen.has(c)) continue; zones++;
    const q = [c]; seen.add(c);
    while (q.length) {
      const x = q.pop()!; const r = Math.floor(x / n), col = x % n;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = col + dc, y = rr * n + cc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n && marked.has(y) && !seen.has(y)) { seen.add(y); q.push(y); }
      }
    }
  }
  return zones;
}

function Amsler() {
  const { logValues, toggleDone, progress, mission, crewId, day } = useApp();
  const N = 12;
  const [eye, setEye] = useState<'left' | 'right'>('right');
  const [marks, setMarks] = useState<Record<string, Set<number>>>({ left: new Set(), right: new Set() });
  const [saved, setSaved] = useState(false);
  const cur = marks[eye];
  const toggle = (i: number) => {
    const s = new Set(cur); if (s.has(i)) s.delete(i); else s.add(i);
    setMarks({ ...marks, [eye]: s }); setSaved(false);
  };
  const zL = zonesOf(marks.left, N), zR = zonesOf(marks.right, N), total = zL + zR;
  const verdict = total === 0 ? 'ok' : total >= 3 ? 'red' : 'amber';
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
      <div className="card pad-lg" style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
        <div className="seg"><button className={eye === 'right' ? 'on' : ''} onClick={() => setEye('right')}>Right eye (cover left)</button><button className={eye === 'left' ? 'on' : ''} onClick={() => setEye('left')}>Left eye (cover right)</button></div>
        <div className="amsler" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {Array.from({ length: N * N }, (_, i) => <div key={i} className={cur.has(i) ? 'mark' : ''} onClick={() => toggle(i)} />)}
          <span className="centerdot" />
        </div>
        <div className="small muted" style={{ textAlign: 'center', maxWidth: 380 }}>Hold the screen at reading distance. Keep looking at the <b>black dot</b>. Tap any squares where lines look <b>wavy, blurred, bent or missing</b>.</div>
      </div>
      <div className="card pad-lg">
        <h3>Amsler grid: early check for SANS</h3>
        <p className="muted small">Spaceflight-Associated Neuro-ocular Syndrome affects many long-duration astronauts: fluid moves toward the head, the back of the eye flattens and the optic disc can swell. A weekly self-check catches changes between imaging sessions.</p>
        <div className="grid g3 mt">
          <div><div className="upper">Right eye</div><div className="num" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{zR}</div><div className="tiny dim">zones</div></div>
          <div><div className="upper">Left eye</div><div className="num" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{zL}</div><div className="tiny dim">zones</div></div>
          <div><div className="upper">Status</div><StatusPill s={verdict} /></div>
        </div>
        <p className="small mt">{verdict === 'ok' ? 'No distortion reported. Repeat next week.' : verdict === 'amber' ? 'Distortion reported. Retest tomorrow; if it persists, the Crew Medical Officer should do an eye ultrasound.' : 'Several distorted zones. Report to the CMO today for ultrasound/fundoscopy and send results to the ground ophthalmologist.'}</p>
        <div className="row mt">
          <button className="btn primary" onClick={() => {
            logValues({ vision: total }); setSaved(true);
            const id = `amsler:${mission}:${crewId}:${day}`; if (!progress.done[id]) toggleDone(id, 15);
          }}>Save result (+15 XP)</button>
          <button className="btn ghost" onClick={() => { setMarks({ left: new Set(), right: new Set() }); setSaved(false); }}>Clear</button>
          {saved && <span className="small" style={{ color: 'var(--ok)' }}>✓ Saved</span>}
        </div>
        <p className="tiny dim mt">Screening aid only; it doesn't replace ophthalmic imaging. Reference: NASA HRP, Risk of SANS.</p>
      </div>
    </div>
  );
}
