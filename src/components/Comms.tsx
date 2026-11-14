import { useEffect, useState } from 'react';
import { useApp } from '../lib/store';
import { METRICS, PLAYBOOK } from '../lib/knowledge';
import { MISSIONS, fmtDelay } from '../lib/missions';
import { CREW } from '../lib/generate';
import { fmtVal } from './ui';

interface Msg { id: number; dir: 'out' | 'in'; text: string; attach?: string[]; sent: number; arrive: number }
const CATS = [
  { id: 'vitals', label: 'Vitals (HR, BP, temp, SpO₂, glucose)' },
  { id: 'mind', label: 'Mood, stress & sleep' },
  { id: 'tests', label: 'Self-tests (PVT, Amsler)' },
  { id: 'rad', label: 'Radiation dose' },
];
const CAT_OF: Record<string, string> = { hr: 'vitals', sbp: 'vitals', dbp: 'vitals', temp: 'vitals', spo2: 'vitals', glucose: 'vitals', hrv: 'vitals', mass: 'vitals', exercise: 'vitals', bone: 'vitals', symptoms: 'vitals', co2: 'vitals', mood: 'mind', stress: 'mind', sleep: 'mind', pvt: 'tests', vision: 'tests', dose: 'rad' };

export default function Comms() {
  const { mission, day, a, crewId } = useApp();
  const M = MISSIONS[mission];
  const delay = M.delay(day);
  const [speed, setSpeed] = useState(60);
  const [share, setShare] = useState<Record<string, boolean>>({ vitals: true, mind: false, tests: true, rad: true });
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  const crew = CREW.find((c) => c.id === crewId)!;

  const send = () => {
    const shared = a.alerts.filter((al) => share[CAT_OF[al.key]]);
    const attach = shared.map((al) => `${METRICS[al.key].name}: ${fmtVal(al.key, a.metrics[al.key].value)} ${METRICS[al.key].unit} (${al.status})`);
    const sent = Date.now(), oneWay = (delay * 1000) / speed;
    const out: Msg = { id: sent, dir: 'out', text: text || 'Daily health summary attached.', attach, sent, arrive: sent + oneWay };
    const top = shared[0];
    const ground = top ? PLAYBOOK[top.key].find((x) => x.level === 'ground') ?? PLAYBOOK[top.key][PLAYBOOK[top.key].length - 1] : null;
    const reply: Msg = { id: sent + 1, dir: 'in', sent: sent + oneWay + 4000, arrive: sent + 2 * oneWay + 4000,
      text: top ? `Flight Surgeon: Thanks, ${crew.name.split(' ').slice(-1)[0]}. Reviewed your ${METRICS[top.key].name.toLowerCase()} trend. Keep following the on-board countermeasures PRANA gave you. Recommendation: ${ground!.title.toLowerCase()}: ${ground!.detail} Send an update in 24 h.`
        : `Flight Surgeon: Data reviewed. All nominal from the ground. Keep up the routine!` };
    setMsgs((m) => [...m, out, reply]); setText('');
  };

  const visible = msgs.filter((m) => m.dir === 'out' || now >= m.sent);

  return (
    <div>
      <div className="section-head"><div><div className="upper">⟿ Distance from Earth</div><h2>Earth link: delay-tolerant messaging</h2></div>
        <div className="seg">{[1, 60, 600].map((s) => <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>{s === 1 ? 'Real time' : `Demo ×${s}`}</button>)}</div>
      </div>

      <div className="card pad-lg mb">
        <div className="row between wrap">
          <div><div className="upper">One-way signal delay · {M.place}</div><div className="num" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent)' }}>{fmtDelay(delay)}</div>
            <div className="small muted">Question → answer takes at least <b>{fmtDelay(delay * 2)}</b>. {delay > 120 ? 'Live conversation is impossible: in an emergency you act first, then report.' : 'Near real-time support is available.'}</div></div>
          <svg width="320" height="70" viewBox="0 0 320 70">
            <circle cx="30" cy="35" r="18" fill="#1d4ed8" /><circle cx="30" cy="35" r="18" fill="none" stroke="#7dd3fc" strokeOpacity="0.5" />
            <text x="30" y="68" fill="#8fa0bb" fontSize="10" textAnchor="middle">Earth</text>
            <line x1="52" y1="35" x2="270" y2="35" stroke="#2b3b5a" strokeDasharray="4 5" />
            {visible.filter((m) => now < m.arrive).map((m) => {
              const p = Math.min(1, (now - m.sent) / (m.arrive - m.sent));
              const x = m.dir === 'out' ? 270 - p * 218 : 52 + p * 218;
              return <circle key={m.id} cx={x} cy={35} r={5} fill={m.dir === 'out' ? '#5eead4' : '#fbbf24'} />;
            })}
            <rect x="272" y="24" width="34" height="22" rx="5" fill="#16233a" stroke="#5eead4" />
            <text x="289" y="68" fill="#8fa0bb" fontSize="10" textAnchor="middle">Crew</text>
          </svg>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 380 }}>
          <h3>Flight surgeon channel</h3>
          <div className="stack mt" style={{ flex: 1, overflow: 'auto', maxHeight: 360 }}>
            {visible.length === 0 && <p className="muted small">No messages yet. PRANA attaches a summary of your alerts, but only the categories you allow.</p>}
            {visible.map((m) => {
              const inFlight = now < m.arrive;
              const p = Math.min(1, (now - m.sent) / (m.arrive - m.sent));
              return (
                <div key={m.id} className={`msg ${m.dir}`}>
                  <div>{m.text}</div>
                  {m.attach && m.attach.length > 0 && <div className="tiny dim" style={{ marginTop: 6 }}>📎 {m.attach.join(' · ')}</div>}
                  <div className="tiny dim" style={{ marginTop: 6 }}>{inFlight ? (m.dir === 'out' ? `travelling to Earth… ${fmtDelay(((m.arrive - now) / 1000) * speed)} left` : 'incoming…') : m.dir === 'out' ? '✓ delivered to Mission Control' : '✓ received'}</div>
                  {inFlight && <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${p * 100}%` }} /></div>}
                </div>
              );
            })}
          </div>
          <div className="row mt">
            <input className="input" placeholder="Message to your flight surgeon…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
            <button className="btn primary" onClick={send}>Send</button>
          </div>
        </div>
        <div className="card">
          <h3>Your data, your choice</h3>
          <p className="muted small">Astronauts tend to under-report symptoms when they worry about being grounded. In PRANA the astronaut owns the data and decides what leaves the spacecraft.</p>
          <div className="stack mt">
            {CATS.map((c) => (
              <label key={c.id} className={`chk ${share[c.id] ? 'on' : ''}`}><input type="checkbox" checked={share[c.id]} onChange={() => setShare({ ...share, [c.id]: !share[c.id] })} />{c.label}</label>
            ))}
          </div>
          <div className="banner info mt small">🔒 Red-level emergencies (e.g. SpO₂ &lt; 90 %, fever &gt; 38.3 °C) are always shared with the Crew Medical Officer on board, regardless of these settings.</div>
          <h3 className="mt" style={{ marginTop: 18 }}>Will be attached</h3>
          <ul className="small muted" style={{ paddingLeft: 18 }}>
            {a.alerts.filter((al) => share[CAT_OF[al.key]]).map((al) => <li key={al.key}>{METRICS[al.key].name}: {al.status}</li>)}
            {a.alerts.filter((al) => share[CAT_OF[al.key]]).length === 0 && <li>Nothing flagged in the shared categories</li>}
          </ul>
          <p className="tiny dim">Mission day {day}. Delay model: light-time distance for {M.name}.</p>
        </div>
      </div>
    </div>
  );
}
