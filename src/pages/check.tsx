// Guided daily check: walks the astronaut through each measurement with instructions,
// then shows what changed. This is how PRANA "gathers health indicators".
import { useEffect, useRef, useState, type FC } from 'react';
import { ArrowLeft, ArrowRight, Check as CheckIcon, Eye, FaceSmile, HeartRounded, Lightning01, MedicalCross, Thermometer02 } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Slider } from '@/components/base/slider/slider';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { useApp } from '@/lib/store';
import { METRICS, type MetricKey } from '@/lib/knowledge';
import { cx } from '@/utils/cx';
import { Card, IconBox, PageHeader, STATUS, StatusBadge, fmtVal } from '@/app/ui';

export const CHECK_STEPS: { id: string; title: string; icon: FC<{ className?: string }>; xp: number }[] = [
  { id: 'heart', title: 'Heart & blood pressure', icon: HeartRounded, xp: 15 },
  { id: 'temp', title: 'Temperature & blood sugar', icon: Thermometer02, xp: 15 },
  { id: 'mind', title: 'Sleep & mood', icon: FaceSmile, xp: 15 },
  { id: 'symptoms', title: 'Symptoms', icon: MedicalCross, xp: 10 },
  { id: 'pvt', title: 'Reaction test', icon: Lightning01, xp: 25 },
  { id: 'vision', title: 'Vision check', icon: Eye, xp: 15 },
];
const SYMPTOMS = ['Headache', 'Nausea / motion sickness', 'Back pain', 'Stuffy nose / sinus', 'Cold sores', 'Skin rash', 'Sore throat', 'Fever or chills', 'Slow-healing cut', 'Blurred vision', 'Unusual fatigue'];
const IMMUNE = ['Cold sores', 'Skin rash', 'Sore throat', 'Fever or chills', 'Slow-healing cut', 'Unusual fatigue'];

function Instructions({ keys }: { keys: MetricKey[] }) {
  return (
    <div className="space-y-3 rounded-xl bg-secondary p-4">
      <p className="text-sm font-semibold text-primary">How to measure</p>
      {keys.map((k) => <div key={k}><p className="text-sm font-medium text-secondary">{METRICS[k].name}</p><p className="text-sm text-tertiary">{METRICS[k].how}</p></div>)}
    </div>
  );
}

function NumField({ k, value, onChange, hint }: { k: MetricKey; value: string; onChange: (v: string) => void; hint?: string }) {
  return <Input label={`${METRICS[k].name} (${METRICS[k].unit})`} type="number" inputMode="decimal" value={value} onChange={onChange} hint={hint ?? 'Pre-filled from your sensor. Correct it if needed.'} />;
}

export default function Check() {
  const { a, logValues, progress, toggleDone, mission, crewId, day, setTab, setFocusMetric } = useApp();
  const [step, setStep] = useState(0);
  const [startScore] = useState(a.readiness);
  const init = (k: MetricKey) => fmtVal(k, a.metrics[k].value);
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries((['sbp', 'dbp', 'hr', 'spo2', 'temp', 'glucose', 'sleep'] as MetricKey[]).map((k) => [k, init(k)])));
  const [mood, setMood] = useState(Math.round(a.metrics.mood.value));
  const [stress, setStress] = useState(Math.round(a.metrics.stress.value));
  const [sym, setSym] = useState<string[]>([]);
  const sid = (id: string) => `step:${mission}:${crewId}:${day}:${id}`;
  const done = (id: string) => !!progress.done[sid(id)];
  const finished = step >= CHECK_STEPS.length;

  const commit = (vals: Partial<Record<MetricKey, number>>) => {
    const changed: Partial<Record<MetricKey, number>> = {};
    (Object.keys(vals) as MetricKey[]).forEach((k) => { const x = vals[k]!; if (!Number.isNaN(x) && x !== +fmtVal(k, a.metrics[k].value)) changed[k] = x; });
    if (Object.keys(changed).length) logValues(changed);
    const s = CHECK_STEPS[step];
    if (!done(s.id)) toggleDone(sid(s.id), s.xp);
    setStep(step + 1);
  };
  const next = () => {
    const id = CHECK_STEPS[step].id;
    if (id === 'heart') commit({ sbp: +v.sbp, dbp: +v.dbp, hr: +v.hr, spo2: +v.spo2 });
    else if (id === 'temp') commit({ temp: +v.temp, glucose: +v.glucose });
    else if (id === 'mind') commit({ sleep: +v.sleep, mood, stress });
    else if (id === 'symptoms') commit({ symptoms: sym.filter((s) => IMMUNE.includes(s)).length });
  };

  return (
    <div>
      <PageHeader eyebrow={`Daily check · mission day ${day}`} title="Today's health check" description="Six short steps, about 5 minutes. Each measurement comes with instructions. Everything stays on this device." />

      {/* progress steps */}
      <ol className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
        {CHECK_STEPS.map((s, i) => {
          const isDone = done(s.id), active = i === step;
          return (
            <li key={s.id}>
              <button onClick={() => setStep(i)} className={cx('flex w-full items-center gap-2 rounded-lg border-t-4 pt-3 text-left', active ? 'border-brand' : isDone ? 'border-[#17B26A]' : 'border-secondary')}>
                <span className={cx('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', isDone ? 'bg-success-solid text-white' : active ? 'bg-brand-solid text-white' : 'bg-tertiary text-tertiary')}>{isDone ? <CheckIcon className="size-3.5" /> : i + 1}</span>
                <span className={cx('text-sm font-medium', active ? 'text-brand-secondary' : 'text-secondary')}>{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {!finished && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" title={<span className="flex items-center gap-3"><IconBox icon={CHECK_STEPS[step].icon} size="sm" />Step {step + 1}: {CHECK_STEPS[step].title}</span>}>
            {CHECK_STEPS[step].id === 'heart' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <NumField k="sbp" value={v.sbp} onChange={(x) => setV({ ...v, sbp: x })} hint="Top number" />
                <NumField k="dbp" value={v.dbp} onChange={(x) => setV({ ...v, dbp: x })} hint="Bottom number" />
                <NumField k="hr" value={v.hr} onChange={(x) => setV({ ...v, hr: x })} />
                <NumField k="spo2" value={v.spo2} onChange={(x) => setV({ ...v, spo2: x })} />
              </div>
            )}
            {CHECK_STEPS[step].id === 'temp' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <NumField k="temp" value={v.temp} onChange={(x) => setV({ ...v, temp: x })} />
                <NumField k="glucose" value={v.glucose} onChange={(x) => setV({ ...v, glucose: x })} hint="Fasting, before breakfast" />
              </div>
            )}
            {CHECK_STEPS[step].id === 'mind' && (
              <div className="space-y-8">
                <NumField k="sleep" value={v.sleep} onChange={(x) => setV({ ...v, sleep: x })} hint="From your sleep band; correct it if it's wrong" />
                <div>
                  <div className="mb-3 flex justify-between text-sm"><span className="font-medium text-secondary">How is your mood?</span><span className="font-semibold text-primary tabular">{mood}/10</span></div>
                  <Slider aria-label="Mood" minValue={1} maxValue={10} value={mood} onChange={(x) => setMood(x as number)} />
                  <div className="mt-1 flex justify-between text-xs text-tertiary"><span>Very low</span><span>Excellent</span></div>
                </div>
                <div>
                  <div className="mb-3 flex justify-between text-sm"><span className="font-medium text-secondary">How stressed are you?</span><span className="font-semibold text-primary tabular">{stress}/10</span></div>
                  <Slider aria-label="Stress" minValue={1} maxValue={10} value={stress} onChange={(x) => setStress(x as number)} />
                  <div className="mt-1 flex justify-between text-xs text-tertiary"><span>Calm</span><span>Overwhelmed</span></div>
                </div>
                <p className="text-sm text-tertiary">Be honest. You decide what is shared with the ground (Earth link → privacy settings).</p>
              </div>
            )}
            {CHECK_STEPS[step].id === 'symptoms' && (
              <div>
                <p className="mb-4 text-sm text-tertiary">Tick anything you've noticed in the last 24 hours.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SYMPTOMS.map((s) => <Checkbox key={s} size="md" label={s} isSelected={sym.includes(s)} onChange={(on) => setSym(on ? [...sym, s] : sym.filter((x) => x !== s))} />)}
                </div>
                {sym.length > 0 && (
                  <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-brand-primary p-4">
                    <p className="text-sm text-secondary">The <b>Symptom guide</b> has step-by-step treatment for {sym.slice(0, 2).join(' and ').toLowerCase()}{sym.length > 2 ? ' and more' : ''}.</p>
                    <Button size="sm" color="secondary" onClick={() => { next(); setTab('treat'); }}>Open guide</Button>
                  </div>
                )}
              </div>
            )}
            {CHECK_STEPS[step].id === 'pvt' && <PVT onSave={(ms) => commit({ pvt: ms })} />}
            {CHECK_STEPS[step].id === 'vision' && <Amsler onSave={(z) => commit({ vision: z })} />}

            <div className="mt-8 flex justify-between border-t border-secondary pt-5">
              <Button color="tertiary" iconLeading={ArrowLeft} isDisabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
              {['pvt', 'vision'].includes(CHECK_STEPS[step].id)
                ? <Button color="secondary" iconTrailing={ArrowRight} onClick={() => setStep(step + 1)}>Skip</Button>
                : <Button color="primary" iconTrailing={ArrowRight} onClick={next}>Save & continue</Button>}
            </div>
          </Card>
          <div className="space-y-6">
            {CHECK_STEPS[step].id === 'heart' && <Instructions keys={['sbp', 'hr', 'spo2']} />}
            {CHECK_STEPS[step].id === 'temp' && <Instructions keys={['temp', 'glucose']} />}
            {CHECK_STEPS[step].id === 'mind' && <Instructions keys={['sleep', 'mood']} />}
            {CHECK_STEPS[step].id === 'symptoms' && <Instructions keys={['symptoms']} />}
            {CHECK_STEPS[step].id === 'pvt' && <Instructions keys={['pvt']} />}
            {CHECK_STEPS[step].id === 'vision' && <Instructions keys={['vision']} />}
            <Card title="Live assessment" bodyClassName="p-0">
              <ul className="divide-y divide-secondary">
                {(['sbp', 'hr', 'temp', 'glucose', 'sleep', 'mood', 'pvt', 'vision'] as MetricKey[]).map((k) => (
                  <li key={k}><button className="flex w-full items-center justify-between px-5 py-2.5 text-left hover:bg-primary_hover" onClick={() => setFocusMetric(k)}>
                    <span className="text-sm text-secondary">{METRICS[k].name}</span>
                    <span className="flex items-center gap-3"><span className="text-sm font-semibold text-primary tabular">{fmtVal(k, a.metrics[k].value)}</span><StatusBadge s={a.metrics[k].status} /></span>
                  </button></li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {finished && (
        <Card>
          <div className="flex flex-col items-center py-6 text-center">
            <IconBox icon={CheckIcon} color="success" size="lg" />
            <h2 className="mt-4 text-xl font-semibold text-primary">Check complete</h2>
            <p className="mt-1 text-md text-tertiary">Readiness {startScore} → <b className="tabular" style={{ color: STATUS[a.status].hex }}>{a.readiness}</b>. {a.alerts.filter((x) => x.status === 'red' || x.status === 'amber').length} item(s) in your plan.</p>
            <div className="mt-6 flex gap-3">
              <Button color="secondary" onClick={() => setStep(0)}>Review answers</Button>
              <Button color="primary" iconTrailing={ArrowRight} onClick={() => setTab('home')}>See my plan</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------- Psychomotor Vigilance Test ---------- */
function PVT({ onSave }: { onSave: (ms: number) => void }) {
  const { a } = useApp();
  const [dur, setDur] = useState(30);
  const [phase, setPhase] = useState<'idle' | 'wait' | 'go' | 'done'>('idle');
  const [rts, setRts] = useState<number[]>([]);
  const [falseStarts, setFalse] = useState(0);
  const [shown, setShown] = useState(0);
  const [msg, setMsg] = useState('');
  const t0 = useRef(0), end = useRef(0), timer = useRef<number | undefined>(undefined), raf = useRef(0);
  const schedule = () => {
    if (performance.now() > end.current) { setPhase('done'); return; }
    setPhase('wait');
    timer.current = window.setTimeout(() => {
      t0.current = performance.now(); setPhase('go');
      const tick = () => { setShown(Math.round(performance.now() - t0.current)); raf.current = requestAnimationFrame(tick); };
      tick();
    }, dur <= 30 ? 1000 + Math.random() * 3000 : 2000 + Math.random() * 4000);
  };
  const start = () => { setRts([]); setFalse(0); setMsg(''); end.current = performance.now() + dur * 1000; schedule(); };
  const hit = () => {
    if (phase === 'wait') { clearTimeout(timer.current); setFalse((f) => f + 1); setMsg('Too early. Wait for the counter.'); schedule(); }
    else if (phase === 'go') { cancelAnimationFrame(raf.current); const rt = performance.now() - t0.current; setRts((r) => [...r, rt]); setMsg(`${Math.round(rt)} ms`); setPhase('wait'); setTimeout(schedule, 600); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' && (phase === 'wait' || phase === 'go')) { e.preventDefault(); hit(); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current); }, []);
  const mean = rts.length ? rts.reduce((x, y) => x + y, 0) / rts.length : 0;
  const lapses = rts.filter((r) => r > 500).length;
  const base = a.metrics.pvt.baseline.mean;
  const slower = mean - base;
  const verdict = slower > 60 || lapses >= 3 ? 'red' : slower > 30 || lapses >= 1 ? 'amber' : 'ok';
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tertiary">Tap the box (or press <kbd className="rounded bg-tertiary px-1.5 text-xs">Space</kbd>) the moment the red counter appears.</p>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {[30, 180].map((d) => <button key={d} disabled={phase === 'wait' || phase === 'go'} onClick={() => setDur(d)} className={cx('rounded-md px-3 py-1.5 text-sm font-semibold', dur === d ? 'bg-primary text-primary shadow-xs' : 'text-quaternary')}>{d === 30 ? '30 s demo' : '3 min standard'}</button>)}
        </div>
      </div>
      <div role="button" tabIndex={0} onMouseDown={hit} onTouchStart={(e) => { e.preventDefault(); hit(); }}
        className="flex h-64 cursor-pointer select-none items-center justify-center rounded-xl bg-[#0C111D] ring-1 ring-secondary">
        {phase === 'idle' && <Button color="primary" size="lg" onClick={start}>Start reaction test</Button>}
        {phase === 'wait' && <div className="text-center"><p className="text-3xl text-[#475467]">+</p><p className="text-sm text-[#98A2B3]">{msg}</p></div>}
        {phase === 'go' && <p className="pvt-pop font-mono text-6xl font-bold text-[#F04438]">{shown}</p>}
        {phase === 'done' && <div className="text-center"><p className="text-lg font-semibold text-white">Test complete: {rts.length} responses</p><Button className="mt-3" color="secondary" size="sm" onClick={start}>Run again</Button></div>}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        <div><p className="text-sm text-tertiary">Mean reaction</p><p className="text-display-xs font-semibold text-primary tabular">{rts.length ? Math.round(mean) : '–'}<span className="text-sm text-tertiary"> ms</span></p></div>
        <div><p className="text-sm text-tertiary">Lapses (&gt;500 ms)</p><p className="text-display-xs font-semibold text-primary tabular">{lapses}</p></div>
        <div><p className="text-sm text-tertiary">Your normal</p><p className="text-display-xs font-semibold text-primary tabular">{Math.round(base)}<span className="text-sm text-tertiary"> ms</span></p></div>
      </div>
      {phase === 'done' && rts.length > 0 && (
        <div className={cx('mt-5 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center', verdict === 'ok' ? 'bg-success-primary' : verdict === 'red' ? 'bg-error-primary' : 'bg-warning-primary')}>
          <p className="flex-1 text-sm text-secondary">{verdict === 'ok' ? 'As alert as before launch. Cleared for critical tasks.' : verdict === 'amber' ? `${Math.round(slower)} ms slower than your normal. Take a 20-minute nap before critical tasks.` : `Significant fatigue (${Math.round(slower)} ms slower, ${lapses} lapses). No robotic arm, docking or EVA prep. Tell your commander.`}</p>
          <Button color="primary" size="sm" onClick={() => onSave(Math.round(mean))}>Save result</Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Amsler grid ---------- */
function zonesOf(marked: Set<number>, n: number) {
  const seen = new Set<number>(); let zones = 0;
  for (const c of marked) {
    if (seen.has(c)) continue; zones++; const q = [c]; seen.add(c);
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
function Amsler({ onSave }: { onSave: (zones: number) => void }) {
  const N = 12;
  const [eye, setEye] = useState<'left' | 'right'>('right');
  const [marks, setMarks] = useState<Record<string, Set<number>>>({ left: new Set(), right: new Set() });
  const cur = marks[eye];
  const toggle = (i: number) => { const s = new Set(cur); if (s.has(i)) s.delete(i); else s.add(i); setMarks({ ...marks, [eye]: s }); };
  const zL = zonesOf(marks.left, N), zR = zonesOf(marks.right, N), total = zL + zR;
  const verdict = total === 0 ? 'ok' : total >= 3 ? 'red' : 'amber';
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(['right', 'left'] as const).map((e) => <button key={e} onClick={() => setEye(e)} className={cx('rounded-md px-3 py-1.5 text-sm font-semibold', eye === e ? 'bg-primary text-primary shadow-xs' : 'text-quaternary')}>{e === 'right' ? 'Right eye (cover left)' : 'Left eye (cover right)'}</button>)}
        </div>
        <div className="relative grid aspect-square w-full max-w-[320px] border-2 border-[#101828] bg-white" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {Array.from({ length: N * N }, (_, i) => <div key={i} onClick={() => toggle(i)} className={cx('cursor-pointer border-[0.5px] border-[#344054]', cur.has(i) && 'bg-[#FDA29B]')} />)}
          <span className="pointer-events-none absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#101828]" />
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-tertiary">Hold the screen at reading distance and keep looking at the <b>centre dot</b>. Tap any squares where the lines look <b>wavy, blurred, bent or missing</b>. Fluid shifting toward the head in weightlessness can change the eye (SANS), and this catches it early between imaging sessions.</p>
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-sm text-tertiary">Right</p><p className="text-display-xs font-semibold tabular">{zR}</p></div>
          <div><p className="text-sm text-tertiary">Left</p><p className="text-display-xs font-semibold tabular">{zL}</p></div>
          <div><p className="text-sm text-tertiary">Result</p><StatusBadge s={verdict} /></div>
        </div>
        <p className="text-sm text-secondary">{verdict === 'ok' ? 'No distortion reported. Repeat next week.' : verdict === 'amber' ? 'Distortion reported. Retest tomorrow; if it persists, your CMO should do an eye ultrasound.' : 'Several distorted zones. See your CMO today for ultrasound and share the result with the ground ophthalmologist.'}</p>
        <Button color="primary" size="md" iconLeading={Eye} onClick={() => onSave(total)}>Save vision result</Button>
      </div>
    </div>
  );
}
