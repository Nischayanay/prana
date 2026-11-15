import { Trophy01, Zap, Star01 } from '@untitledui/icons';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { ProgressBar } from '@/components/base/progress-indicators/progress-indicators';
import { useApp } from '@/lib/store';
import { cx } from '@/utils/cx';
import { CHECK_STEPS } from './check';
import { Card, IconBox, PageHeader } from '@/app/ui';

interface Task { id: string; time: string; title: string; detail: string; xp: number; weekly?: boolean }
const TASKS: Task[] = [
  { id: 'hydrate', time: 'All day', title: 'Drink 2.5 L of water', detail: 'Protects your kidneys from calcium released by bone, and keeps up blood volume.', xp: 10 },
  { id: 'resist', time: '10:00', title: 'Resistance exercise: 60 min', detail: 'Squats, deadlifts, heel raises at your prescribed load.', xp: 20 },
  { id: 'cardio', time: '16:00', title: 'Cardio: 60 min', detail: 'Treadmill (harness) or cycle ergometer intervals.', xp: 20 },
  { id: 'social', time: '19:00', title: 'Crew meal or call home', detail: 'Protected social time, a countermeasure against isolation.', xp: 10 },
  { id: 'winddown', time: '21:30', title: 'Wind down', detail: 'Dim warm light, no screens, same sleep window every night.', xp: 10 },
  { id: 'mass', time: 'Fri', title: 'Body mass measurement', detail: 'On the body-mass measurement device.', xp: 10, weekly: true },
];
const BADGES = [
  { xp: 50, name: 'First orbit' }, { xp: 150, name: 'Steady pulse' }, { xp: 300, name: 'Iron bones' },
  { xp: 500, name: 'Clear mind' }, { xp: 800, name: 'Self-surgeon' }, { xp: 1200, name: 'Mars ready' },
];

export default function Routine() {
  const { progress, toggleDone, mission, crewId, day } = useApp();
  const key = (t: Task) => `task:${mission}:${crewId}:${day}:${t.id}`;
  const stepsDone = CHECK_STEPS.filter((s) => progress.done[`step:${mission}:${crewId}:${day}:${s.id}`]).length;
  const doneCount = TASKS.filter((t) => progress.done[key(t)]).length + (stepsDone === CHECK_STEPS.length ? 1 : 0);
  const total = TASKS.length + 1;
  const level = Math.floor(progress.xp / 100) + 1;
  let streak = 0;
  for (let d = day; d > 0; d--) { if (CHECK_STEPS.some((s) => progress.done[`step:${mission}:${crewId}:${d}:${s.id}`])) streak++; else break; }

  return (
    <div>
      <PageHeader eyebrow={`Routine · mission day ${day}`} title="Daily routine & rewards" description="XP rewards looking after yourself (measuring, exercising, following your plan), never 'good numbers', so nobody is tempted to hide a symptom." />
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Card><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-tertiary">Level</p><p className="mt-1 text-display-sm font-semibold text-primary tabular">{level}</p></div><IconBox icon={Star01} /></div><ProgressBar className="mt-4" value={progress.xp % 100} labelPosition="right" valueFormatter={() => `${progress.xp} XP`} /></Card>
        <Card><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-tertiary">Check-in streak</p><p className="mt-1 text-display-sm font-semibold text-primary tabular">{streak} {streak === 1 ? 'day' : 'days'}</p></div><IconBox icon={Zap} color="warning" /></div><p className="mt-4 text-sm text-tertiary">Days in a row with a daily check</p></Card>
        <Card><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-tertiary">Today</p><p className="mt-1 text-display-sm font-semibold text-primary tabular">{doneCount}/{total}</p></div><IconBox icon={Trophy01} color="success" /></div><ProgressBar className="mt-4" value={doneCount} max={total} labelPosition="right" /></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Today's routine" bodyClassName="p-0">
          <ul className="divide-y divide-secondary">
            <li className="flex items-start gap-4 px-5 py-4">
              <span className="w-14 shrink-0 pt-0.5 text-sm text-quaternary tabular">07:00</span>
              <div className="flex-1"><p className="text-sm font-medium text-primary">Daily health check</p><p className="text-sm text-tertiary">{stepsDone}/{CHECK_STEPS.length} steps done: vitals, blood sugar, mood, symptoms, reaction and vision.</p></div>
              <BadgeWithDot type="pill-color" size="sm" color={stepsDone === CHECK_STEPS.length ? 'success' : 'gray'}>+95 XP</BadgeWithDot>
            </li>
            {TASKS.map((t) => (
              <li key={t.id} className="flex items-start gap-4 px-5 py-4">
                <span className="w-14 shrink-0 pt-0.5 text-sm text-quaternary tabular">{t.time}</span>
                <div className="flex-1"><Checkbox isSelected={!!progress.done[key(t)]} onChange={() => toggleDone(key(t), t.xp)} label={<span className={progress.done[key(t)] ? 'text-tertiary line-through' : ''}>{t.title}{t.weekly ? ' · weekly' : ''}</span>} hint={t.detail} /></div>
                <BadgeWithDot type="pill-color" size="sm" color={progress.done[key(t)] ? 'success' : 'gray'}>+{t.xp} XP</BadgeWithDot>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Badges">
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((b) => {
              const got = progress.xp >= b.xp;
              return (
                <div key={b.name} className={cx('flex flex-col items-center rounded-xl p-4 text-center ring-1 ring-inset', got ? 'bg-brand-primary ring-brand' : 'ring-secondary opacity-60')}>
                  <IconBox icon={Trophy01} size="sm" color={got ? 'brand' : 'gray'} />
                  <p className="mt-2 text-sm font-semibold text-primary">{b.name}</p><p className="text-xs text-tertiary tabular">{b.xp} XP</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
