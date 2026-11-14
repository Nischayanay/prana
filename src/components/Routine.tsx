import { useApp } from '../lib/store';

interface Task { id: string; time: string; title: string; detail: string; xp: number; tab?: string; weekly?: boolean }
const TASKS: Task[] = [
  { id: 'wake-vitals', time: '06:30', title: 'Wake-up vitals', detail: 'Resting HR, blood pressure, temperature, before leaving the sleep station.', xp: 10, tab: 'checkin' },
  { id: 'glucose', time: '06:45', title: 'Fasting blood sugar', detail: 'Finger-prick before breakfast.', xp: 10, tab: 'checkin' },
  { id: 'checkin', time: '07:00', title: 'Daily check-in (60 s)', detail: 'Mood, stress, sleep, symptoms.', xp: 20, tab: 'checkin' },
  { id: 'hydrate', time: 'All day', title: 'Drink 2.5 L of water', detail: 'Protects the kidneys (bone calcium is released) and blood volume.', xp: 10 },
  { id: 'resist', time: '10:00', title: 'Resistance exercise: 60 min', detail: 'Squats, deadlifts, heel raises at prescribed load.', xp: 20 },
  { id: 'cardio', time: '16:00', title: 'Cardio: 60 min', detail: 'Treadmill (harness) or cycle ergometer intervals.', xp: 20 },
  { id: 'social', time: '19:00', title: 'Crew meal / call home', detail: 'Protected social time; isolation countermeasure.', xp: 10 },
  { id: 'winddown', time: '21:30', title: 'Wind-down', detail: 'Dim warm light, no screens, same sleep window.', xp: 10 },
  { id: 'pvt', time: 'Mon', title: 'Reaction test (PVT)', detail: 'Weekly fatigue check, and before any critical operation.', xp: 25, tab: 'tests', weekly: true },
  { id: 'amsler', time: 'Wed', title: 'Amsler vision check', detail: 'Weekly SANS screening, both eyes.', xp: 15, tab: 'tests', weekly: true },
  { id: 'mass', time: 'Fri', title: 'Body mass measurement', detail: 'Body-mass measurement device.', xp: 10, weekly: true },
];
const BADGES = [
  { xp: 50, name: 'First Orbit', icon: '🛰' }, { xp: 150, name: 'Steady Pulse', icon: '❤' }, { xp: 300, name: 'Iron Bones', icon: '🦴' },
  { xp: 500, name: 'Clear Mind', icon: '🧠' }, { xp: 800, name: 'Self-Surgeon', icon: '⚕' }, { xp: 1200, name: 'Mars Ready', icon: '🔴' },
];

export default function Routine() {
  const { progress, toggleDone, mission, crewId, day, setTab } = useApp();
  const key = (t: Task) => `task:${mission}:${crewId}:${day}:${t.id}`;
  const doneCount = TASKS.filter((t) => progress.done[key(t)]).length;
  const level = Math.floor(progress.xp / 100) + 1;
  // streak: consecutive previous days with a saved check-in or ≥5 tasks
  let streak = 0;
  for (let d = day; d > 0; d--) {
    const any = progress.done[`checkin:${mission}:${crewId}:${d}`] || TASKS.filter((t) => progress.done[`task:${mission}:${crewId}:${d}:${t.id}`]).length >= 5;
    if (any) streak++; else break;
  }

  return (
    <div>
      <div className="section-head"><div><div className="upper">Mission routine · day {day}</div><h2>Today's health tasks</h2></div></div>
      <div className="grid g3 mb">
        <div className="card"><div className="upper">Level</div><div className="num" style={{ fontSize: '2rem', fontWeight: 800 }}>{level}</div>
          <div className="progress"><div style={{ width: `${progress.xp % 100}%` }} /></div><div className="tiny dim" style={{ marginTop: 4 }}>{progress.xp} XP · {100 - (progress.xp % 100)} to next level</div></div>
        <div className="card"><div className="upper">Streak</div><div className="num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--amber)' }}>🔥 {streak}</div><div className="tiny dim">days in a row with a check-in</div></div>
        <div className="card"><div className="upper">Today</div><div className="num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{doneCount}/{TASKS.length}</div><div className="progress"><div style={{ width: `${(doneCount / TASKS.length) * 100}%` }} /></div></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <div className="card">
          <div className="actions" style={{ marginTop: 0 }}>
            {TASKS.map((t) => {
              const done = !!progress.done[key(t)];
              return (
                <label key={t.id} className={`action ${done ? 'done' : ''}`} style={{ gridTemplateColumns: 'auto 64px 1fr auto' }}>
                  <input type="checkbox" checked={done} onChange={() => toggleDone(key(t), t.xp)} />
                  <span className="num small dim" style={{ marginTop: 2 }}>{t.time}</span>
                  <div><b>{t.title}</b> {t.weekly && <span className="tag">weekly</span>}<div className="muted small">{t.detail}</div>
                    {t.tab && <button className="link" onClick={(e) => { e.preventDefault(); setTab(t.tab!); }}>Open →</button>}</div>
                  <span className="lvl self">+{t.xp} XP</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h3>Badges</h3>
          <div className="grid g2 mt" style={{ gap: 10 }}>
            {BADGES.map((b) => {
              const got = progress.xp >= b.xp;
              return (
                <div key={b.name} className="tile" style={{ opacity: got ? 1 : 0.4, cursor: 'default', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', filter: got ? undefined : 'grayscale(1)' }}>{b.icon}</div>
                  <b className="small">{b.name}</b><div className="tiny dim">{b.xp} XP</div>
                </div>
              );
            })}
          </div>
          <p className="small muted mt">XP comes from routine tasks, check-ins, self-tests and completed countermeasures. It rewards looking after yourself, not "good numbers", so nobody is tempted to hide symptoms.</p>
        </div>
      </div>
    </div>
  );
}
