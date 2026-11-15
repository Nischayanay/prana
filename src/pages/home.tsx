import { AlertTriangle, ArrowRight, CheckCircle, ClipboardCheck, Globe02, InfoCircle, MedicalCross } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { ProgressBar } from '@/components/base/progress-indicators/progress-indicators';
import { useApp } from '@/lib/store';
import { HAZARDS, LEVEL_LABEL, METRICS, type MetricKey } from '@/lib/knowledge';
import { MISSIONS, fmtDelay } from '@/lib/missions';
import { CREW } from '@/lib/generate';
import { cx } from '@/utils/cx';
import { CHECK_STEPS } from './check';
import { Card, DataTag, DeltaChip, IconBox, LEVEL_BADGE, PageHeader, STATUS, Sparkline, StatusBadge, fmtVal } from '@/app/ui';

const RANK = { ok: 0, watch: 1, amber: 2, red: 3 } as const;
const VITALS: MetricKey[] = ['sbp', 'hr', 'glucose', 'temp', 'sleep', 'mood'];
const VITAL_LABEL: Partial<Record<MetricKey, string>> = { sbp: 'Blood pressure', glucose: 'Blood sugar', sleep: 'Sleep last night' };

export function Gauge({ value, color, size = 168 }: { value: number; color: string; size?: number }) {
  const sw = 14, r = (size - sw) / 2, c = Math.PI * r;
  return (
    <svg width={size} height={size / 2 + sw} viewBox={`0 0 ${size} ${size / 2 + sw}`}>
      <path d={`M ${sw / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - sw / 2} ${size / 2}`} fill="none" stroke="#EAECF0" strokeWidth={sw} strokeLinecap="round" />
      <path d={`M ${sw / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - sw / 2} ${size / 2}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
    </svg>
  );
}

export default function Home() {
  const { a, day, mission, crewId, setFocusMetric, progress, toggleDone, setTab } = useApp();
  const M = MISSIONS[mission];
  const crew = CREW.find((c) => c.id === crewId)!;
  const first = crew.name.replace(/^(Cmdr\.|Dr\.)\s*/, '').split(' ')[0];
  const red = a.alerts.filter((x) => x.status === 'red');
  const amber = a.alerts.filter((x) => x.status === 'amber');
  const stepsDone = CHECK_STEPS.filter((s) => progress.done[`step:${mission}:${crewId}:${day}:${s.id}`]).length;
  const rc = a.readiness >= 85 ? STATUS.ok : a.readiness >= 70 ? STATUS.amber : STATUS.red;
  const delay = M.delay(day);

  return (
    <div>
      <PageHeader
        eyebrow={`Mission day ${day} · ${M.name}`}
        title={`Good morning, ${first}`}
        description="Here's how your body is adapting today, compared with your own pre-flight normal."
        actions={<>
          <Button color="secondary" size="md" iconLeading={MedicalCross} onClick={() => setTab('treat')}>I don't feel well</Button>
          <Button color="primary" size="md" iconLeading={ClipboardCheck} onClick={() => setTab('check')}>Start today's check</Button>
        </>}
      />

      {(red.length > 0 || amber.length > 0) && (
        <div className={cx('mb-6 flex flex-col gap-4 rounded-xl p-4 ring-1 ring-inset sm:flex-row sm:items-center', red.length ? 'bg-error-primary ring-error_subtle' : 'bg-warning-primary ring-[#FEDF89]')}>
          <IconBox icon={AlertTriangle} color={red.length ? 'error' : 'warning'} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">{red.length ? `${red.length} indicator${red.length > 1 ? 's need' : ' needs'} action today` : `${amber.length} indicator${amber.length > 1 ? 's' : ''} to keep an eye on`}</p>
            <p className="text-sm text-secondary">{[...red, ...amber].slice(0, 4).map((x) => METRICS[x.key].name).join(' · ')}. Your plan below tells you what to do.</p>
          </div>
          <Button color="secondary" size="sm" iconTrailing={ArrowRight} onClick={() => setFocusMetric((red[0] ?? amber[0]).key)}>Why?</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Readiness" subtitle="All 18 indicators combined" action={<StatusBadge s={a.status} />}>
          <div className="flex flex-col items-center">
            <div className="relative">
              <Gauge value={a.readiness} color={rc.hex} size={200} />
              <div className="absolute inset-x-0 bottom-1 text-center">
                <p className="text-display-md font-semibold text-primary tabular">{a.readiness}</p>
              </div>
            </div>
            <p className="mt-2 text-center text-sm text-tertiary">{a.status === 'red' ? 'Not fit for critical tasks until the red items are handled.' : a.status === 'amber' ? 'Fit for duty. Follow your plan for the amber items.' : 'Fully fit for duty, including critical operations.'}</p>
          </div>
        </Card>

        <Card title="Today's check" subtitle="6 short steps · about 5 minutes">
          <div className="flex items-baseline gap-2"><span className="text-display-sm font-semibold text-primary tabular">{stepsDone}/{CHECK_STEPS.length}</span><span className="text-sm text-tertiary">steps done</span></div>
          <ProgressBar value={stepsDone} max={CHECK_STEPS.length} className="mt-3" valueFormatter={() => ''} />
          <ul className="mt-4 space-y-2">
            {CHECK_STEPS.map((s) => {
              const done = !!progress.done[`step:${mission}:${crewId}:${day}:${s.id}`];
              return (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle className={cx('size-4', done ? 'text-fg-success-primary' : 'text-fg-quaternary')} />
                  <span className={done ? 'text-tertiary line-through' : 'text-secondary'}>{s.title}</span>
                </li>
              );
            })}
          </ul>
          <Button color="link-color" size="sm" className="mt-4" iconTrailing={ArrowRight} onClick={() => setTab('check')}>{stepsDone ? 'Continue' : 'Start'} check</Button>
        </Card>

        <Card title="Earth link" subtitle={M.place}>
          <div className="flex items-start gap-3">
            <IconBox icon={Globe02} color={delay > 120 ? 'warning' : 'brand'} />
            <div><p className="text-display-xs font-semibold text-primary tabular">{fmtDelay(delay)}</p><p className="text-sm text-tertiary">one-way signal delay</p></div>
          </div>
          <p className="mt-4 text-sm text-secondary">{delay > 120 ? `A question to your flight surgeon takes at least ${fmtDelay(delay * 2)} to answer. PRANA's guidance works without waiting.` : 'Ground support is close to real time.'}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-tertiary">Gravity</dt><dd className="font-medium text-primary">{M.gravityLabel}</dd></div>
            <div><dt className="text-tertiary">Mission dose</dt><dd className="font-medium text-primary tabular">{a.cumDose.toFixed(0)} mSv</dd></div>
          </dl>
          <Button color="link-color" size="sm" className="mt-4" iconTrailing={ArrowRight} onClick={() => setTab('comms')}>Message flight surgeon</Button>
        </Card>
      </div>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Your vitals</h2>
        <DataTag />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VITALS.map((k) => {
          const e = a.metrics[k];
          return (
            <button key={k} onClick={() => setFocusMetric(k)} className="group rounded-xl bg-primary p-5 text-left shadow-xs ring-1 ring-secondary ring-inset transition hover:ring-primary focus-visible:outline-2 focus-visible:outline-focus-ring">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium text-tertiary">{VITAL_LABEL[k] ?? METRICS[k].name}<InfoCircle className="size-4 text-fg-quaternary opacity-0 transition group-hover:opacity-100" /></p>
                <StatusBadge s={e.status} />
              </div>
              <p className="mt-2 text-display-sm font-semibold text-primary tabular">
                {k === 'sbp' ? `${fmtVal('sbp', e.value)}/${fmtVal('dbp', a.metrics.dbp.value)}` : fmtVal(k, e.value)}
                <span className="ml-1 text-md font-medium text-tertiary">{METRICS[k].unit}</span>
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <DeltaChip e={e} />
                <div className="h-10 w-28 shrink-0"><Sparkline k={k} /></div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Your plan for today" subtitle="Countermeasures for what PRANA found. Tick them off as you go.">
          {a.alerts.length === 0 && <p className="text-sm text-tertiary">Nothing to fix today. Complete your daily check to keep your streak.</p>}
          <div className="space-y-5">
            {a.alerts.slice(0, 5).map((al) => (
              <div key={al.key}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <button className="text-left text-sm font-semibold text-primary hover:underline" onClick={() => setFocusMetric(al.key)}>{METRICS[al.key].name} <span className="font-normal text-tertiary">· {fmtVal(al.key, a.metrics[al.key].value)} {METRICS[al.key].unit}</span></button>
                  <StatusBadge s={al.status} />
                </div>
                <ul className="divide-y divide-secondary rounded-lg ring-1 ring-secondary">
                  {al.actions.map((x, i) => {
                    const id = `${mission}:${crewId}:${day}:${al.key}:${i}`;
                    return (
                      <li key={i} className="flex items-start justify-between gap-3 px-3 py-2.5">
                        <Checkbox isSelected={!!progress.done[id]} onChange={() => toggleDone(id)} label={<span className={progress.done[id] ? 'text-tertiary line-through' : ''}>{x.title}</span>} hint={x.detail} />
                        <BadgeWithDot type="pill-color" size="sm" color={LEVEL_BADGE[x.level]} className="shrink-0">{LEVEL_LABEL[x.level]}</BadgeWithDot>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2" title="The five hazards" subtitle="NASA Human Research Program framework">
          <ul className="space-y-4">
            {a.hazards.map((h) => {
              const H = HAZARDS.find((x) => x.id === h.id)!;
              const worst = h.metrics.filter((m) => m.status !== 'ok').sort((x, y) => RANK[y.status] - RANK[x.status])[0];
              return (
                <li key={h.id}>
                  <button className="w-full text-left" onClick={() => (worst ? setFocusMetric(worst.key) : setTab('body'))}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">{H.name}</span>
                      <span className="text-sm font-semibold tabular" style={{ color: STATUS[h.status].hex }}>{h.score}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-quaternary"><div className="h-full rounded-full transition-all" style={{ width: `${h.score}%`, background: STATUS[h.status].hex }} /></div>
                    <p className="mt-1 text-xs text-tertiary">{worst ? `${METRICS[worst.key].name}: ${STATUS[worst.status].label.toLowerCase()}` : `${h.metrics.length} indicators normal`}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
