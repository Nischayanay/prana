// PRANA: Physiological Readiness & Autonomy Network for Astronauts
// Team Yogic · NASA Space Apps Challenge 2026. UI built with Untitled UI React (MIT).
// AI-assisted code (Anthropic Claude), reviewed by the team.
import { useState, type FC } from 'react';
import { ClipboardCheck, Globe02, Home02, InfoCircle, LineChartUp02, MedicalCross, Microscope, PlayCircle, Shield01, Sliders01, Trophy01, User01, Wifi } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Slider } from '@/components/base/slider/slider';
import { SlideoutMenu } from '@/components/application/slideout-menus/slideout-menu';
import { AppProvider, useApp } from '@/lib/store';
import { MISSIONS, fmtDelay, type MissionId } from '@/lib/missions';
import { CREW } from '@/lib/generate';
import { cx } from '@/utils/cx';
import { MetricDrawer, STATUS } from '@/app/ui';
import Home from '@/pages/home';
import Check from '@/pages/check';
import Treat from '@/pages/treat';
import Body from '@/pages/body';
import Trends from '@/pages/trends';
import Routine from '@/pages/routine';
import Radiation from '@/pages/radiation';
import Comms from '@/pages/comms';
import Evidence from '@/pages/evidence';
import About, { SCENES } from '@/pages/about';

const NAV: { group: string; items: { id: string; label: string; icon: FC<{ className?: string }> }[] }[] = [
  { group: 'My health', items: [
    { id: 'home', label: 'Today', icon: Home02 },
    { id: 'check', label: 'Daily check', icon: ClipboardCheck },
    { id: 'treat', label: 'Symptom guide', icon: MedicalCross },
    { id: 'body', label: 'Body map', icon: User01 },
    { id: 'trends', label: 'Trends', icon: LineChartUp02 },
    { id: 'routine', label: 'Routine & rewards', icon: Trophy01 },
  ] },
  { group: 'Mission', items: [
    { id: 'radiation', label: 'Radiation & air', icon: Shield01 },
    { id: 'comms', label: 'Earth link', icon: Globe02 },
  ] },
  { group: 'Project', items: [
    { id: 'evidence', label: 'Real crew data', icon: Microscope },
    { id: 'about', label: 'About & demo', icon: InfoCircle },
  ] },
];
const PAGES: Record<string, FC> = { home: Home, check: Check, treat: Treat, body: Body, trends: Trends, routine: Routine, radiation: Radiation, comms: Comms, evidence: Evidence, about: About };

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#155EEF" />
      <ellipse cx="32" cy="32" rx="22" ry="8" fill="none" stroke="#B2CCFF" strokeWidth="3" transform="rotate(-25 32 32)" />
      <path d="M12 34h10l5-11 7 20 5-13 3 4h10" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SimulationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mission, setMission, day, setDay, crewId, setCrewId, crewAssess, setTab } = useApp();
  return (
    <SlideoutMenu isOpen={open} onOpenChange={(o) => { if (!o) onClose(); }} isDismissable className="max-w-md">
      <SlideoutMenu.Header onClose={onClose}>
        <p className="text-sm font-semibold text-brand-secondary">Demo controls</p>
        <h2 className="mt-1 text-xl font-semibold text-primary">Mission simulation</h2>
        <p className="mt-1 text-sm text-tertiary">On a real mission PRANA runs on each astronaut's own device. For judging, pick a mission, an astronaut and a day.</p>
      </SlideoutMenu.Header>
      <SlideoutMenu.Content>
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Mission</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MISSIONS) as MissionId[]).map((id) => (
              <button key={id} onClick={() => setMission(id)} className={cx('rounded-lg p-3 text-left ring-1 ring-inset', mission === id ? 'bg-brand-primary ring-2 ring-brand' : 'ring-secondary hover:bg-primary_hover')}>
                <p className="text-sm font-semibold text-primary">{MISSIONS[id].name}</p><p className="text-xs text-tertiary">{MISSIONS[id].gravityLabel} · {MISSIONS[id].doseRate} mSv/day</p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-tertiary">{MISSIONS[mission].note}</p>
        </div>
        <div>
          <div className="mb-3 flex justify-between"><p className="text-sm font-semibold text-primary">Mission day</p><p className="text-sm font-semibold text-brand-secondary tabular">Day {day} / {MISSIONS[mission].days}</p></div>
          <Slider aria-label="Mission day" minValue={1} maxValue={MISSIONS[mission].days} value={day} onChange={(v) => setDay(v as number)} />
          <div className="mt-2 flex justify-between text-xs text-quaternary"><span>Launch</span><span>Day 60: CO₂ fault · Day 96: solar storm</span></div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Astronaut</p>
          <ul className="space-y-2">
            {CREW.map((c) => {
              const ca = crewAssess[c.id];
              return (
                <li key={c.id}><button onClick={() => setCrewId(c.id)} className={cx('flex w-full items-center gap-3 rounded-lg p-3 text-left ring-1 ring-inset', crewId === c.id ? 'bg-brand-primary ring-2 ring-brand' : 'ring-secondary hover:bg-primary_hover')}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tertiary text-sm font-semibold text-secondary">{c.avatar}</span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-primary">{c.name}</p><p className="truncate text-xs text-tertiary">{c.story}</p></div>
                  <span className="text-lg font-semibold tabular" style={{ color: (ca.readiness >= 85 ? STATUS.ok : ca.readiness >= 70 ? STATUS.amber : STATUS.red).hex }}>{ca.readiness}</span>
                </button></li>
              );
            })}
          </ul>
        </div>
        <div className="pb-6">
          <p className="mb-2 text-sm font-semibold text-primary">Jump to a scenario</p>
          <div className="grid grid-cols-2 gap-2">
            {SCENES.map((s) => <Button key={s.title} color="secondary" size="sm" onClick={() => { setDay(s.day); setCrewId(s.crew); setTab('home'); onClose(); }}>{s.title}</Button>)}
          </div>
        </div>
      </SlideoutMenu.Content>
    </SlideoutMenu>
  );
}

function Shell() {
  const { tab, setTab, mission, day, crewId, a } = useApp();
  const [sim, setSim] = useState(false);
  const M = MISSIONS[mission];
  const crew = CREW.find((c) => c.id === crewId)!;
  const redCount = a.alerts.filter((x) => x.status === 'red').length;
  const Page = PAGES[tab] ?? Home;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-b border-secondary bg-primary lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-4 lg:px-6 lg:pt-6">
          <Logo />
          <div><p className="text-md font-semibold tracking-wide text-primary">PRANA</p><p className="text-xs text-tertiary">Astronaut health, on board</p></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:px-4 lg:pt-4">
          {NAV.map((g) => (
            <div key={g.group} className="flex gap-1 lg:flex-col lg:gap-0.5">
              <p className="hidden px-3 pb-1 text-xs font-semibold text-quaternary lg:block">{g.group}</p>
              {g.items.map((it) => {
                const Icon = it.icon, on = tab === it.id;
                return (
                  <button key={it.id} onClick={() => setTab(it.id)} className={cx('flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition', on ? 'bg-active text-secondary_hover' : 'text-secondary hover:bg-primary_hover')}>
                    <Icon className={cx('size-5', on ? 'text-fg-quaternary_hover' : 'text-fg-quaternary')} />
                    <span className="whitespace-nowrap">{it.label}</span>
                    {it.id === 'home' && redCount > 0 && <span className="ml-auto rounded-full bg-error-primary px-2 py-0.5 text-xs font-medium text-error-primary ring-1 ring-error_subtle ring-inset">{redCount}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-secondary p-4 lg:block">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-brand-secondary ring-1 ring-brand ring-inset">{crew.avatar}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{crew.name}</p><p className="truncate text-xs text-tertiary">{crew.role}</p></div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 px-2 text-xs text-quaternary"><Wifi className="size-3.5" />Works offline · data stays on device</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-secondary bg-primary/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="font-semibold text-primary">{M.name}</span>
            <span className="text-tertiary">Day <b className="text-primary tabular">{day}</b></span>
            <span className="text-tertiary">{M.gravityLabel}</span>
            <span className="text-tertiary">Earth delay <b className="text-brand-secondary tabular">{fmtDelay(M.delay(day))}</b></span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button color="secondary" size="sm" iconLeading={PlayCircle} onClick={() => setTab('about')}>Guided demo</Button>
            <Button color="secondary" size="sm" iconLeading={Sliders01} onClick={() => setSim(true)}>Simulation</Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Page />
          <p className="mt-12 text-center text-xs text-quaternary">PRANA · Team Yogic · NASA Space Apps 2026 · Decision-support prototype, not a medical device</p>
        </main>
      </div>
      <MetricDrawer />
      <SimulationPanel open={sim} onClose={() => setSim(false)} />
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
