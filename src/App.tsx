// PRANA: Physiological Readiness & Autonomy Network for Astronauts
// Team Yogic · NASA Space Apps Challenge 2026. AI-assisted code (Anthropic Claude), reviewed by the team.
import { AppProvider, useApp } from './lib/store';
import { MISSIONS, fmtDelay, type MissionId } from './lib/missions';
import { CREW } from './lib/generate';
import { STATUS_COLOR } from './lib/engine';
import Today, { readinessColor } from './components/Today';
import BodyMap from './components/BodyMap';
import Trends from './components/Trends';
import CheckIn from './components/CheckIn';
import Tests from './components/Tests';
import Radiation from './components/Radiation';
import Comms from './components/Comms';
import RealData from './components/RealData';
import Routine from './components/Routine';
import About from './components/About';
import { MetricModal } from './components/ui';

const TABS = [
  { id: 'today', label: 'Today', ic: '◉' },
  { id: 'body', label: 'Body map', ic: '♥' },
  { id: 'trends', label: 'Trends', ic: '∿' },
  { id: 'checkin', label: 'Check-in', ic: '✎' },
  { id: 'tests', label: 'Self-tests', ic: '⚡' },
  { id: 'routine', label: 'Routine & XP', ic: '★' },
  { id: 'radiation', label: 'Radiation', ic: '☢' },
  { id: 'comms', label: 'Earth link', ic: '⟿' },
  { id: 'real', label: 'Real crew data', ic: '⧉' },
  { id: 'about', label: 'About & demo', ic: 'ⓘ' },
];
const EVENTS = [{ d: 60, l: 'CO₂ fault' }, { d: 96, l: '☀ Solar storm' }];

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0f1829" stroke="#1f2c45" />
      <ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="#5eead4" strokeWidth="2.5" transform="rotate(-25 32 32)" />
      <path d="M10 34h12l5-12 7 22 5-14 3 4h12" fill="none" stroke="#f8fafc" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Shell() {
  const { tab, setTab, mission, setMission, day, setDay, crewId, setCrewId, crewAssess, a } = useApp();
  const M = MISSIONS[mission];
  const redCount = a.alerts.filter((x) => x.status === 'red').length;
  const View = { today: Today, body: BodyMap, trends: Trends, checkin: CheckIn, tests: Tests, routine: Routine, radiation: Radiation, comms: Comms, real: RealData, about: About }[tab] ?? Today;
  return (
    <div className="app">
      <nav className="side">
        <div className="brand"><Logo /><div><b>PRANA</b><small>ASTRONAUT HEALTH · ON BOARD</small></div></div>
        {TABS.map((t) => (
          <button key={t.id} className={`nav ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="ic">{t.ic}</span>{t.label}
            {t.id === 'today' && redCount > 0 && <span className="badge">{redCount}</span>}
          </button>
        ))}
        <div className="side-foot">● Offline-capable · data stays on device<br />Team Yogic · Space Apps 2026<br />Not a medical device</div>
      </nav>
      <main className="main">
        <div className="topbar">
          <div className="seg">
            {(Object.keys(MISSIONS) as MissionId[]).map((id) => <button key={id} className={mission === id ? 'on' : ''} onClick={() => setMission(id)}>{MISSIONS[id].name}</button>)}
          </div>
          <div className="grow daybar">
            <div className="row between small"><span className="muted">Mission day <b className="num" style={{ color: 'var(--text)' }}>{day}</b> / {M.days}</span><span className="muted">{M.place} · {M.gravityLabel} · Earth delay <b className="num" style={{ color: 'var(--accent)' }}>{fmtDelay(M.delay(day))}</b></span></div>
            <input type="range" min={1} max={M.days} value={day} onChange={(e) => setDay(+e.target.value)} aria-label="Mission day" />
            <div className="events">{EVENTS.map((e) => <span key={e.d} style={{ left: `${(e.d / M.days) * 100}%` }} onClick={() => setDay(e.d + (e.d === 60 ? 1 : 0))}>▲ {e.l}</span>)}</div>
          </div>
        </div>
        <div className="crewbar">
          {CREW.map((c) => {
            const ca = crewAssess[c.id];
            return (
              <button key={c.id} className={`crew ${crewId === c.id ? 'on' : ''}`} onClick={() => setCrewId(c.id)}>
                <span className="avatar" style={{ borderColor: STATUS_COLOR[ca.status] }}>{c.avatar}</span>
                <div style={{ minWidth: 0 }}><div className="nm">{c.name}</div><div className="rl">{c.role}</div></div>
                <span className="sc" style={{ color: readinessColor(ca.readiness) }}>{ca.readiness}</span>
              </button>
            );
          })}
        </div>
        <View />
        <MetricModal />
      </main>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
