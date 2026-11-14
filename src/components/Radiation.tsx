import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../lib/store';
import { CAREER_LIMIT_MSV } from '../lib/knowledge';
import { MISSIONS, type MissionId } from '../lib/missions';
import { Ring, SimTag, StatusPill } from './ui';

interface Notif { messageType: string; messageID: string; messageURL: string; messageIssueTime: string; messageBody: string }
const TYPE: Record<string, [string, string]> = {
  SEP: ['Solar energetic particles', 'var(--red)'], FLR: ['Solar flare', 'var(--amber)'], CME: ['Coronal mass ejection', 'var(--amber)'],
  GST: ['Geomagnetic storm', 'var(--watch)'], RBE: ['Radiation belt enhancement', 'var(--watch)'], IPS: ['Interplanetary shock', 'var(--watch)'],
  HSS: ['High-speed solar wind', 'var(--dim)'], MPC: ['Magnetopause crossing', 'var(--dim)'], Report: ['Weekly report', 'var(--dim)'],
};
function summary(body: string) {
  const m = body.match(/## Summary:?\s*([\s\S]*?)(\n##|$)/i);
  return (m ? m[1] : body).replace(/\s+/g, ' ').trim().slice(0, 240);
}

export function useDonki() {
  const [data, setData] = useState<Notif[] | null>(null);
  const [src, setSrc] = useState<'live' | 'cache' | 'loading'>('loading');
  useEffect(() => {
    const end = new Date(), start = new Date(Date.now() - 30 * 864e5);
    const f = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://api.nasa.gov/DONKI/notifications?startDate=${f(start)}&endDate=${f(end)}&type=all&api_key=DEMO_KEY`;
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
    fetch(url, { signal: ctl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Notif[]) => { setData(d); setSrc('live'); })
      .catch(() => fetch('./donki-cache.json').then((r) => r.json()).then((d: Notif[]) => { setData(d); setSrc('cache'); }).catch(() => setData([])))
      .finally(() => clearTimeout(to));
    return () => ctl.abort();
  }, []);
  return { data, src };
}

export default function Radiation() {
  const { records, day, mission, a, setFocusMetric } = useApp();
  const M = MISSIONS[mission];
  const { data, src } = useDonki();
  const rows = useMemo(() => {
    let cum = 0;
    return records.filter((r) => r.day > 0 && r.day <= day).map((r) => { cum += r.v.dose; return { day: r.day, dose: +r.v.dose.toFixed(2), cum: +cum.toFixed(1) }; });
  }, [records, day]);
  const usedPct = (a.cumDose / CAREER_LIMIT_MSV) * 100;
  const daysLeft = Math.round((CAREER_LIMIT_MSV - a.cumDose) / M.doseRate);
  const storm = day === 96 || day === 97;
  const sorted = (data ?? []).slice().sort((x, y) => y.messageIssueTime.localeCompare(x.messageIssueTime));

  return (
    <div>
      <div className="section-head"><div><div className="upper">☢ Space radiation</div><h2>Dose tracker & solar storm watch</h2></div><SimTag /></div>
      {storm && <div className="banner red mb"><b style={{ color: 'var(--red)' }}>☢ SOLAR PARTICLE EVENT, mission day 96.</b> Go to the storm shelter (water-walled crew quarters) now. Stay until the all-clear. Today's dose: {a.metrics.dose.value.toFixed(1)} mSv (it would be about 4× higher unsheltered).</div>}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)' }}>
        <div className="card pad-lg row" style={{ gap: 20, flexWrap: 'wrap' }}>
          <div className="ring-wrap">
            <Ring value={Math.min(100, usedPct)} color={usedPct > 80 ? 'var(--red)' : usedPct > 50 ? 'var(--amber)' : 'var(--accent)'} />
            <div className="center"><div><div className="big" style={{ fontSize: '2rem' }}>{a.cumDose.toFixed(0)}</div><div className="upper">mSv of 600</div></div></div>
          </div>
          <div className="stack" style={{ flex: 1, minWidth: 180 }}>
            <StatusPill s={a.metrics.dose.status} />
            <div className="small muted">Career limit (NASA-STD-3001): <b>600 mSv</b>, about 3 % added lifetime cancer-death risk.</div>
            <div className="small">Today: <b className="num">{a.metrics.dose.value.toFixed(2)} mSv</b> · Typical here: <b className="num">{M.doseRate} mSv/day</b></div>
            <div className="small">At this rate the limit is reached in <b className="num">{daysLeft}</b> more days.</div>
            <button className="link" style={{ textAlign: 'left' }} onClick={() => setFocusMetric('dose')}>What should I do? →</button>
          </div>
        </div>
        <div className="card">
          <div className="row between"><h3>Cumulative mission dose</h3><span className="tiny dim">dashed = career limit</span></div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis tickLine={false} axisLine={false} domain={[0, (max: number) => Math.max(max * 1.15, 100)]} />
              <Tooltip formatter={(v) => `${v} mSv`} labelFormatter={(d) => `Day ${d}`} />
              <ReferenceLine y={CAREER_LIMIT_MSV} stroke="#f87171" strokeDasharray="5 4" ifOverflow="extendDomain" label={{ value: '600 mSv career limit', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }} />
              <Area dataKey="cum" stroke="#5eead4" fill="#5eead4" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={rows} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="day" hide /><YAxis hide />
              <Tooltip formatter={(v) => `${v} mSv`} labelFormatter={(d) => `Day ${d} daily dose`} />
              <Bar dataKey="dose" fill="#fbbf24" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <div className="tiny dim">Daily dose (spike = solar particle event, day 96)</div>
        </div>
      </div>

      <div className="grid g2 mt">
        <div className="card">
          <h3>Dose by destination (published measurements)</h3>
          <table className="data mt">
            <thead><tr><th>Location</th><th className="num">mSv / day</th><th className="num">180 days</th></tr></thead>
            <tbody>{(Object.keys(MISSIONS) as MissionId[]).map((id) => <tr key={id} style={{ color: id === mission ? 'var(--accent)' : undefined }}><td>{MISSIONS[id].name}</td><td className="num">{MISSIONS[id].doseRate}</td><td className="num">{(MISSIONS[id].doseRate * 180).toFixed(0)}</td></tr>)}</tbody>
          </table>
          <p className="tiny dim mt">ISS: ~0.5 mSv/day · Mars cruise: MSL-RAD 1.84 mSv/day (Zeitlin et al. 2013) · Mars surface: Curiosity RAD ~0.64 mSv/day (Hassler et al. 2014) · Lunar surface: Chang'e-4 LND 1.37 mSv/day (Zhang et al. 2020). See also: CSA, "Monitoring radiation for astronaut health".</p>
          <h3 className="mt" style={{ marginTop: 18 }}>Storm shelter protocol</h3>
          <ol className="small muted" style={{ paddingLeft: 18 }}>
            <li>Alert received → stop EVA / move out of low-shielding modules within 30 min.</li>
            <li>Shelter in the crew quarters walled with water and stores.</li>
            <li>Wear your personal dosimeter; PRANA logs the dose automatically.</li>
            <li>Stay until the proton flux falls below the threshold (all-clear from the commander).</li>
          </ol>
        </div>
        <div className="card">
          <div className="row between"><h3>Live space weather: NASA DONKI</h3>
            <span className={`tag ${src === 'live' ? 'real' : ''}`}>{src === 'loading' ? 'loading…' : src === 'live' ? '● LIVE · api.nasa.gov' : 'offline cache (Oct–Nov 2026)'}</span></div>
          <p className="tiny dim">Real alerts from NASA's Space Weather Database Of Notifications, Knowledge, Information (last 30 days). On a real mission this feed would arrive with the comms delay; PRANA keeps the last copy for offline use.</p>
          <div className="stack mt" style={{ maxHeight: 340, overflow: 'auto' }}>
            {data === null && <p className="muted small">Contacting NASA…</p>}
            {sorted.slice(0, 25).map((n) => {
              const [label, color] = TYPE[n.messageType] ?? [n.messageType, 'var(--dim)'];
              return (
                <a key={n.messageID} href={n.messageURL} target="_blank" rel="noreferrer" className="tile" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="row between"><span className="row small" style={{ gap: 6 }}><span className="dot" style={{ background: color }} /><b>{label}</b></span><span className="tiny dim num">{n.messageIssueTime.replace('T', ' ').replace('Z', ' UTC')}</span></div>
                  <div className="small muted" style={{ marginTop: 4 }}>{summary(n.messageBody)}…</div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
