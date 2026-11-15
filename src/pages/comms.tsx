import { useEffect, useState } from 'react';
import { Lock01, Send01 } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Toggle } from '@/components/base/toggle/toggle';
import { useApp } from '@/lib/store';
import { METRICS, PLAYBOOK } from '@/lib/knowledge';
import { MISSIONS, fmtDelay } from '@/lib/missions';
import { CREW } from '@/lib/generate';
import { cx } from '@/utils/cx';
import { Seg } from './trends';
import { Card, IconBox, PageHeader, StatusBadge, fmtVal } from '@/app/ui';

interface Msg { id: number; dir: 'out' | 'in'; text: string; attach?: string[]; sent: number; arrive: number }
const CATS = [
  { id: 'vitals', label: 'Vitals', hint: 'HR, blood pressure, temperature, SpO₂, blood sugar' },
  { id: 'mind', label: 'Mood, stress & sleep', hint: 'Private by default' },
  { id: 'tests', label: 'Self-tests', hint: 'Reaction time, vision grid' },
  { id: 'rad', label: 'Radiation dose', hint: 'Dosimeter readings' },
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
  const shared = a.alerts.filter((al) => share[CAT_OF[al.key]]);

  const send = () => {
    const attach = shared.map((al) => `${METRICS[al.key].name} ${fmtVal(al.key, a.metrics[al.key].value)} ${METRICS[al.key].unit}`);
    const sent = Date.now(), one = (delay * 1000) / speed;
    const top = shared[0];
    const g = top ? PLAYBOOK[top.key].find((x) => x.level === 'ground') ?? PLAYBOOK[top.key].at(-1)! : null;
    setMsgs((m) => [...m,
      { id: sent, dir: 'out', text: text || 'Daily health summary attached.', attach, sent, arrive: sent + one },
      { id: sent + 1, dir: 'in', sent: sent + one + 4000, arrive: sent + 2 * one + 4000,
        text: top ? `Thanks, ${crew.name.split(' ').at(-1)}. Reviewed your ${METRICS[top.key].name.toLowerCase()} trend. Keep following PRANA's on-board steps. Recommendation: ${g!.title.toLowerCase()}. ${g!.detail} Update us in 24 h.` : 'Data reviewed. All nominal from the ground. Keep up the routine!' }]);
    setText('');
  };
  const visible = msgs.filter((m) => m.dir === 'out' || now >= m.sent);

  return (
    <div>
      <PageHeader eyebrow="Earth link" title="Talk to your flight surgeon" description="Messages travel at light speed, which is slow at Mars distances. PRANA shows the real delay and attaches only the data you choose to share."
        actions={<Seg items={[{ id: 1, label: 'Real time' }, { id: 60, label: 'Demo ×60' }, { id: 600, label: 'Demo ×600' }]} value={speed} onChange={setSpeed} />} />
      <Card className="mb-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-tertiary">One-way delay · {M.place}</p>
            <p className="text-display-md font-semibold text-brand-secondary tabular">{fmtDelay(delay)}</p>
            <p className="text-sm text-secondary">Question → answer: at least <b>{fmtDelay(delay * 2)}</b>. {delay > 120 ? 'In an emergency, act first and report afterwards.' : 'Near real-time support available.'}</p>
          </div>
          <svg width="340" height="72" viewBox="0 0 340 72" className="max-w-full">
            <circle cx="32" cy="32" r="20" fill="#2E90FA" /><text x="32" y="68" fill="#667085" fontSize="11" textAnchor="middle">Earth</text>
            <line x1="56" y1="32" x2="286" y2="32" stroke="#D0D5DD" strokeDasharray="4 5" />
            {visible.filter((m) => now < m.arrive).map((m) => { const p = Math.min(1, (now - m.sent) / (m.arrive - m.sent)); return <circle key={m.id} cx={m.dir === 'out' ? 286 - p * 230 : 56 + p * 230} cy={32} r={5} fill={m.dir === 'out' ? '#155EEF' : '#F79009'} />; })}
            <rect x="290" y="21" width="36" height="22" rx="5" fill="#EFF4FF" stroke="#155EEF" /><text x="308" y="68" fill="#667085" fontSize="11" textAnchor="middle">You</text>
          </svg>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Flight surgeon channel" bodyClassName="flex flex-col gap-3 min-h-[360px]">
          <div className="flex flex-1 flex-col gap-3 overflow-auto">
            {visible.length === 0 && <p className="text-sm text-tertiary">No messages yet. Your shared alerts are attached automatically.</p>}
            {visible.map((m) => {
              const inFlight = now < m.arrive, p = Math.min(1, (now - m.sent) / (m.arrive - m.sent));
              return (
                <div key={m.id} className={cx('max-w-[85%] rounded-xl px-4 py-3 text-sm', m.dir === 'out' ? 'self-end bg-brand-solid text-white' : 'self-start bg-secondary text-primary')}>
                  {m.dir === 'in' && <p className="mb-1 text-xs font-semibold text-tertiary">Flight Surgeon · Mission Control</p>}
                  <p>{m.text}</p>
                  {m.attach && m.attach.length > 0 && <p className={cx('mt-2 text-xs', m.dir === 'out' ? 'text-white/80' : 'text-tertiary')}>Attached: {m.attach.join(' · ')}</p>}
                  <p className={cx('mt-2 text-xs', m.dir === 'out' ? 'text-white/70' : 'text-quaternary')}>{inFlight ? (m.dir === 'out' ? `Travelling to Earth… ${fmtDelay(((m.arrive - now) / 1000) * speed)} left` : 'Incoming…') : m.dir === 'out' ? '✓ Delivered to Mission Control' : '✓ Received'}</p>
                  {inFlight && <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/30"><div className="h-full bg-white" style={{ width: `${p * 100}%` }} /></div>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 border-t border-secondary pt-4">
            <Input className="flex-1" placeholder="Message to your flight surgeon…" value={text} onChange={setText} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
            <Button color="primary" iconLeading={Send01} onClick={send}>Send</Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Your data, your choice" subtitle="Astronauts often under-report symptoms for fear of being grounded. You decide what leaves the spacecraft.">
            <div className="space-y-4">{CATS.map((c) => <Toggle key={c.id} size="sm" label={c.label} hint={c.hint} isSelected={share[c.id]} onChange={(on) => setShare({ ...share, [c.id]: on })} />)}</div>
            <div className="mt-5 flex gap-3 rounded-lg bg-secondary p-3"><Lock01 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" /><p className="text-xs text-tertiary">Life-threatening readings (SpO₂ under 90%, fever over 38.3 °C) always go to the on-board Crew Medical Officer, whatever these settings are.</p></div>
          </Card>
          <Card title="Will be attached" bodyClassName="p-0">
            <ul className="divide-y divide-secondary">
              {shared.length === 0 && <li className="px-5 py-3 text-sm text-tertiary">Nothing flagged in the shared categories.</li>}
              {shared.map((al) => <li key={al.key} className="flex items-center justify-between px-5 py-2.5"><span className="text-sm text-secondary">{METRICS[al.key].name}</span><StatusBadge s={al.status} /></li>)}
            </ul>
          </Card>
          <div className="flex items-center gap-3 text-xs text-quaternary"><IconBox icon={Send01} size="sm" color="gray" />Delay from light-time distance for {M.name}, mission day {day}.</div>
        </div>
      </div>
    </div>
  );
}
