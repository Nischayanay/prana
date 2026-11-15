// Shared PRANA UI pieces built on Untitled UI React components (MIT).
// AI-assisted code (Anthropic Claude), reviewed by Team Yogic.
import type { FC, ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowUp } from '@untitledui/icons';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { SlideoutMenu } from '@/components/application/slideout-menus/slideout-menu';
import { ChartTooltipContent } from '@/components/application/charts/charts-base';
import { cx } from '@/utils/cx';
import { useApp } from '@/lib/store';
import { HAZARDS, LEVEL_LABEL, METRICS, PLAYBOOK, type Level, type MetricKey } from '@/lib/knowledge';
import type { MetricEval, Status } from '@/lib/engine';

export const STATUS: Record<Status, { label: string; badge: 'success' | 'blue' | 'warning' | 'error'; hex: string; icon: 'success' | 'gray' | 'warning' | 'error' }> = {
  ok: { label: 'Normal', badge: 'success', hex: '#17B26A', icon: 'success' },
  watch: { label: 'Watch', badge: 'blue', hex: '#2E90FA', icon: 'gray' },
  amber: { label: 'Caution', badge: 'warning', hex: '#F79009', icon: 'warning' },
  red: { label: 'Act now', badge: 'error', hex: '#F04438', icon: 'error' },
};

export function StatusBadge({ s, size = 'sm' }: { s: Status; size?: 'sm' | 'md' | 'lg' }) {
  return <BadgeWithDot type="pill-color" color={STATUS[s].badge} size={size}>{STATUS[s].label}</BadgeWithDot>;
}

export const LEVEL_BADGE: Record<Level, 'success' | 'warning' | 'blue'> = { self: 'success', crew: 'warning', ground: 'blue' };

export const fmtVal = (k: MetricKey, x: number) => x.toFixed(METRICS[k].decimals);

const NO_BASELINE: MetricKey[] = ['co2', 'dose', 'bone', 'vision', 'symptoms', 'exercise'];
export const hasBaseline = (k: MetricKey) => !NO_BASELINE.includes(k);

/** "▲ 12% vs your normal" chip */
export function DeltaChip({ e }: { e: MetricEval }) {
  if (!hasBaseline(e.key)) return null;
  const pct = (e.drift / e.baseline.mean) * 100;
  const m = METRICS[e.key];
  const bad = m.bad === 'both' ? Math.abs(e.z) >= 2 : m.bad === 'up' ? e.z >= 2 : e.z <= -2;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-sm font-medium tabular', bad ? 'text-error-primary' : 'text-tertiary')}>
      <Icon className="size-4" />{Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%
      <span className="ml-1 font-normal text-tertiary">vs your normal</span>
    </span>
  );
}

export function Card({ title, subtitle, action, children, className, bodyClassName }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cx('rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-secondary px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-md font-semibold text-primary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-tertiary">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cx('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-semibold text-brand-secondary">{eyebrow}</p>}
        <h1 className="text-display-xs font-semibold text-primary">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-md text-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function DataTag({ real }: { real?: boolean }) {
  return real
    ? <BadgeWithDot type="modern" color="success" size="sm">Real NASA data</BadgeWithDot>
    : <BadgeWithDot type="modern" color="warning" size="sm">Simulated mission data</BadgeWithDot>;
}

export function IconBox({ icon, color = 'brand', size = 'md' }: { icon: FC<{ className?: string }>; color?: 'brand' | 'gray' | 'success' | 'warning' | 'error'; size?: 'sm' | 'md' | 'lg' }) {
  return <FeaturedIcon icon={icon} color={color} theme="light" size={size} />;
}

export function Sparkline({ k, days = 30, height = 40 }: { k: MetricKey; days?: number; height?: number }) {
  const { records, day, a } = useApp();
  const rows = records.filter((r) => r.day > day - days && r.day <= day).map((r) => ({ d: r.day, v: r.v[k] }));
  const c = STATUS[a.metrics[k].status].hex;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs><linearGradient id={`sp-${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} stopOpacity={0.25} /><stop offset="1" stopColor={c} stopOpacity={0} /></linearGradient></defs>
        <YAxis hide domain={['auto', 'auto']} />
        <Area dataKey="v" stroke={c} strokeWidth={2} fill={`url(#sp-${k})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Full metric history: daily, 7-day average, personal-normal band, limits. */
export function MetricChart({ k, height = 240, window = 180 }: { k: MetricKey; height?: number; window?: number }) {
  const { records, day, a } = useApp();
  const m = METRICS[k];
  const ev = a.metrics[k];
  const from = Math.max(records[0].day, day - window);
  const rows = records.filter((r) => r.day >= from && r.day <= day).map((r) => ({ day: r.day, v: +r.v[k].toFixed(3) }) as { day: number; v: number; avg?: number });
  rows.forEach((r, i) => { const s = rows.slice(Math.max(0, i - 6), i + 1); r.avg = +(s.reduce((x, y) => x + y.v, 0) / s.length).toFixed(3); });
  const lo = ev.baseline.mean - 2 * ev.baseline.sd, hi = ev.baseline.mean + 2 * ev.baseline.sd;
  const c = STATUS[ev.status].hex;
  const fmt = (v: unknown) => `${Number(v).toFixed(m.decimals || 1)} ${m.unit}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="#EAECF0" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tick={{ fill: '#667085', fontSize: 12 }} tickFormatter={(d) => (d <= 0 ? `L${d}` : `D${d}`)} />
        <YAxis tickLine={false} axisLine={false} domain={['auto', 'auto']} width={52} tick={{ fill: '#667085', fontSize: 12 }} />
        {hasBaseline(k) && <ReferenceArea y1={lo} y2={hi} fill="#155EEF" fillOpacity={0.06} stroke="none" ifOverflow="extendDomain" />}
        {m.highAmber !== undefined && <ReferenceLine y={m.highAmber} stroke="#F79009" strokeDasharray="4 4" />}
        {m.lowAmber !== undefined && <ReferenceLine y={m.lowAmber} stroke="#F79009" strokeDasharray="4 4" />}
        {m.highRed !== undefined && <ReferenceLine y={m.highRed} stroke="#F04438" strokeDasharray="2 4" />}
        {m.lowRed !== undefined && <ReferenceLine y={m.lowRed} stroke="#F04438" strokeDasharray="2 4" />}
        {from <= 0 && <ReferenceLine x={0} stroke="#D0D5DD" label={{ value: 'Launch', fill: '#98A2B3', fontSize: 11, position: 'insideTopLeft' }} />}
        <Tooltip content={<ChartTooltipContent />} formatter={fmt} labelFormatter={(d) => `Mission day ${d}`} />
        <Line dataKey="v" name="Daily" stroke="#98A2B3" strokeOpacity={0.6} dot={false} strokeWidth={1} isAnimationActive={false} />
        <Line dataKey="avg" name="7-day average" stroke={c} dot={false} strokeWidth={2.5} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Slide-out explanation for one indicator: why flagged, how to measure, what to do. */
export function MetricDrawer() {
  const { focusMetric: k, setFocusMetric, a, setTab } = useApp();
  const open = !!k;
  const m = k ? METRICS[k] : null;
  const ev = k ? a.metrics[k] : null;
  const hz = m ? HAZARDS.find((h) => h.id === m.hazard)! : null;
  return (
    <SlideoutMenu isOpen={open} onOpenChange={(o) => { if (!o) setFocusMetric(null); }} isDismissable className="max-w-xl">
      {k && m && ev && hz && (
        <>
          <SlideoutMenu.Header onClose={() => setFocusMetric(null)}>
            <p className="text-sm font-semibold text-brand-secondary">{hz.name}</p>
            <h2 className="mt-1 text-xl font-semibold text-primary">{m.name}</h2>
          </SlideoutMenu.Header>
          <SlideoutMenu.Content>
            <div className="flex flex-wrap items-end gap-6">
              <div><p className="text-sm text-tertiary">Today</p><p className="text-display-sm font-semibold text-primary tabular">{fmtVal(k, ev.value)} <span className="text-lg font-medium text-tertiary">{m.unit}</span></p></div>
              {hasBaseline(k) && <div><p className="text-sm text-tertiary">Your normal</p><p className="text-lg font-semibold text-secondary tabular">{fmtVal(k, ev.baseline.mean - 2 * ev.baseline.sd)}–{fmtVal(k, ev.baseline.mean + 2 * ev.baseline.sd)}</p></div>}
              <div className="ml-auto"><StatusBadge s={ev.status} size="lg" /></div>
            </div>
            <div className="rounded-xl ring-1 ring-secondary p-3"><MetricChart k={k} height={200} /></div>
            <p className="-mt-3 text-xs text-tertiary">Grey: daily reading · Coloured: 7-day average · Blue band: your pre-flight normal · Dashed: caution / safety limits</p>

            <div className={cx('rounded-xl p-4', ev.status === 'ok' ? 'bg-success-primary' : ev.status === 'red' ? 'bg-error-primary' : 'bg-warning-primary')}>
              <p className="text-sm font-semibold text-primary">Why am I seeing this?</p>
              {ev.reasons.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary">{ev.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                : <p className="mt-1 text-sm text-secondary">Within your personal normal range and the safety limits. Keep it up.</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-sm font-semibold text-primary">Why it matters in space</p><p className="mt-1 text-sm text-tertiary">{m.why}</p></div>
              <div><p className="text-sm font-semibold text-primary">How to measure</p><p className="mt-1 text-sm text-tertiary">{m.how}</p></div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">What you can do</p>
              <ul className="divide-y divide-secondary rounded-xl ring-1 ring-secondary">
                {PLAYBOOK[k].map((x, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 p-3">
                    <div><p className="text-sm font-medium text-primary">{x.title}</p><p className="text-sm text-tertiary">{x.detail}</p></div>
                    <BadgeWithDot type="pill-color" size="sm" color={LEVEL_BADGE[x.level]} className="shrink-0">{LEVEL_LABEL[x.level]}</BadgeWithDot>
                  </li>
                ))}
              </ul>
            </div>
            <p className="pb-6 text-xs text-quaternary">Reference: {m.source}</p>
          </SlideoutMenu.Content>
          {(k === 'pvt' || k === 'vision' || m.selfReported) && (
            <SlideoutMenu.Footer>
              <Button size="md" color="primary" className="w-full" onClick={() => { setFocusMetric(null); setTab('check'); }}>Measure it now</Button>
            </SlideoutMenu.Footer>
          )}
        </>
      )}
    </SlideoutMenu>
  );
}
