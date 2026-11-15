import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, Shield01, Wind01 } from '@untitledui/icons';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { ChartTooltipContent } from '@/components/application/charts/charts-base';
import { useApp } from '@/lib/store';
import { CAREER_LIMIT_MSV } from '@/lib/knowledge';
import { MISSIONS, type MissionId } from '@/lib/missions';
import { cx } from '@/utils/cx';
import { Gauge } from './home';
import { Card, DataTag, IconBox, MetricChart, PageHeader, STATUS, StatusBadge } from '@/app/ui';

interface Notif { messageType: string; messageID: string; messageURL: string; messageIssueTime: string; messageBody: string }
const TYPE: Record<string, [string, 'error' | 'warning' | 'blue' | 'gray']> = {
  SEP: ['Solar energetic particles', 'error'], FLR: ['Solar flare', 'warning'], CME: ['Coronal mass ejection', 'warning'],
  GST: ['Geomagnetic storm', 'blue'], RBE: ['Radiation belt enhancement', 'blue'], IPS: ['Interplanetary shock', 'blue'],
  HSS: ['High-speed solar wind', 'gray'], MPC: ['Magnetopause crossing', 'gray'], Report: ['Weekly report', 'gray'],
};
const summary = (b: string) => ((b.match(/## Summary:?\s*([\s\S]*?)(\n##|$)/i) ?? [, b])[1] ?? b).replace(/\s+/g, ' ').trim().slice(0, 220);

function useDonki() {
  const [data, setData] = useState<Notif[] | null>(null);
  const [src, setSrc] = useState<'live' | 'cache' | 'loading'>('loading');
  useEffect(() => {
    const f = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://api.nasa.gov/DONKI/notifications?startDate=${f(new Date(Date.now() - 30 * 864e5))}&endDate=${f(new Date())}&type=all&api_key=DEMO_KEY`;
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
  const { records, day, mission, a } = useApp();
  const M = MISSIONS[mission];
  const { data, src } = useDonki();
  const rows = useMemo(() => { let c = 0; return records.filter((r) => r.day > 0 && r.day <= day).map((r) => { c += r.v.dose; return { day: r.day, dose: +r.v.dose.toFixed(2), cum: +c.toFixed(1) }; }); }, [records, day]);
  const usedPct = (a.cumDose / CAREER_LIMIT_MSV) * 100;
  const storm = day === 96 || day === 97;
  const sorted = (data ?? []).slice().sort((x, y) => y.messageIssueTime.localeCompare(x.messageIssueTime));
  const color = usedPct > 80 ? STATUS.red.hex : usedPct > 50 ? STATUS.amber.hex : '#155EEF';

  return (
    <div>
      <PageHeader eyebrow="Radiation & cabin air" title="Your radiation dose and air quality" description="Two invisible hazards you can't feel: PRANA tracks them for you and tells you when to shelter or move." actions={<DataTag />} />
      {storm && (
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-error-primary p-4 ring-1 ring-error_subtle ring-inset">
          <IconBox icon={AlertTriangle} color="error" />
          <div><p className="text-sm font-semibold text-error-primary">Solar particle event: go to the storm shelter now</p><p className="text-sm text-secondary">Water-walled crew quarters. Stay until the commander gives the all-clear. Today's dose {a.metrics.dose.value.toFixed(1)} mSv (about 4× higher unsheltered).</p></div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Mission dose" subtitle="vs NASA career limit (NASA-STD-3001)" action={<StatusBadge s={a.metrics.dose.status} />}>
          <div className="flex flex-col items-center">
            <div className="relative"><Gauge value={Math.min(100, usedPct)} color={color} size={200} />
              <div className="absolute inset-x-0 bottom-1 text-center"><p className="text-display-sm font-semibold text-primary tabular">{a.cumDose.toFixed(0)}</p><p className="text-xs text-tertiary">of 600 mSv</p></div></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-tertiary">Today</dt><dd className="font-semibold text-primary tabular">{a.metrics.dose.value.toFixed(2)} mSv</dd></div>
            <div><dt className="text-tertiary">Typical here</dt><dd className="font-semibold text-primary tabular">{M.doseRate} mSv/day</dd></div>
            <div className="col-span-2"><dt className="text-tertiary">Limit reached at this rate in</dt><dd className="font-semibold text-primary tabular">{Math.round((CAREER_LIMIT_MSV - a.cumDose) / M.doseRate)} days</dd></div>
          </dl>
        </Card>
        <Card className="lg:col-span-2" title="Cumulative dose" subtitle="Daily bars show the solar storm on day 96">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={rows} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <defs><linearGradient id="cum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#155EEF" stopOpacity={0.25} /><stop offset="1" stopColor="#155EEF" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#EAECF0" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tick={{ fill: '#667085', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#667085', fontSize: 12 }} domain={[0, (m: number) => Math.max(m * 1.15, 100)]} />
              <Tooltip content={<ChartTooltipContent />} formatter={(v) => `${v} mSv`} labelFormatter={(d) => `Day ${d}`} />
              <ReferenceLine y={CAREER_LIMIT_MSV} stroke="#F04438" strokeDasharray="5 4" ifOverflow="extendDomain" label={{ value: '600 mSv limit', fill: '#F04438', fontSize: 11, position: 'insideTopRight' }} />
              <Area dataKey="cum" name="Cumulative" stroke="#155EEF" strokeWidth={2} fill="url(#cum)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={rows} margin={{ top: 0, right: 10, left: -12, bottom: 0 }}><XAxis dataKey="day" hide /><YAxis hide />
              <Tooltip content={<ChartTooltipContent />} formatter={(v) => `${v} mSv`} labelFormatter={(d) => `Day ${d}`} />
              <Bar dataKey="dose" name="Daily dose" fill="#F79009" radius={[2, 2, 0, 0]} isAnimationActive={false} /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Live space weather" subtitle="NASA DONKI notifications, last 30 days"
          action={<BadgeWithDot type="pill-color" size="sm" color={src === 'live' ? 'success' : 'gray'}>{src === 'loading' ? 'Connecting…' : src === 'live' ? 'Live · api.nasa.gov' : 'Offline copy'}</BadgeWithDot>} bodyClassName="p-0">
          <ul className="max-h-[420px] divide-y divide-secondary overflow-auto">
            {data === null && <li className="px-5 py-4 text-sm text-tertiary">Contacting NASA…</li>}
            {sorted.slice(0, 25).map((n) => {
              const [label, c] = TYPE[n.messageType] ?? [n.messageType, 'gray'];
              return (
                <li key={n.messageID}><a href={n.messageURL} target="_blank" rel="noreferrer" className="block px-5 py-3 hover:bg-primary_hover">
                  <div className="flex items-center justify-between gap-3"><BadgeWithDot type="pill-color" size="sm" color={c}>{label}</BadgeWithDot><span className="flex items-center gap-1 text-xs text-quaternary tabular">{n.messageIssueTime.replace('T', ' ').replace('Z', ' UTC')}<ArrowUpRight className="size-3" /></span></div>
                  <p className="mt-1.5 text-sm text-tertiary">{summary(n.messageBody)}…</p>
                </a></li>
              );
            })}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card title="Storm shelter protocol" action={<IconBox icon={Shield01} size="sm" />}>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-secondary">
              <li>Alert received → stop EVA and leave low-shielding modules within 30 min.</li>
              <li>Shelter in the crew quarters walled with water and stores.</li>
              <li>Wear your personal dosimeter; PRANA logs the dose automatically.</li>
              <li>Stay until the proton flux drops and the commander gives the all-clear.</li>
            </ol>
          </Card>
          <Card title="Cabin CO₂" subtitle="NASA-STD-3001 limit 2.5 mmHg (24-h average)" action={<span className="flex items-center gap-2"><IconBox icon={Wind01} size="sm" /><StatusBadge s={a.metrics.co2.status} /></span>}>
            <MetricChart k="co2" height={150} window={90} />
          </Card>
          <Card title="Dose by destination" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-secondary text-left text-xs text-tertiary"><th className="px-5 py-2 font-medium">Location</th><th className="px-5 py-2 text-right font-medium">mSv/day</th><th className="px-5 py-2 text-right font-medium">180 days</th></tr></thead>
              <tbody>{(Object.keys(MISSIONS) as MissionId[]).map((id) => <tr key={id} className={cx('border-b border-secondary last:border-0', id === mission && 'bg-brand-primary font-semibold')}><td className="px-5 py-2 text-secondary">{MISSIONS[id].name}</td><td className="px-5 py-2 text-right tabular">{MISSIONS[id].doseRate}</td><td className="px-5 py-2 text-right tabular">{(MISSIONS[id].doseRate * 180).toFixed(0)}</td></tr>)}</tbody>
            </table>
            <p className="px-5 py-3 text-xs text-quaternary">Measured rates: ISS ~0.5; MSL-RAD cruise 1.84 (Zeitlin 2013); Curiosity RAD surface 0.64 (Hassler 2014); Chang'e-4 lunar 1.37 (Zhang 2020). See CSA, "Monitoring radiation for astronaut health".</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
