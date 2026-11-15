import { useState } from 'react';
import { useApp } from '@/lib/store';
import { HAZARDS, METRICS, type HazardId, type MetricKey } from '@/lib/knowledge';
import { cx } from '@/utils/cx';
import { Card, DataTag, DeltaChip, MetricChart, PageHeader, StatusBadge, fmtVal } from '@/app/ui';

function Seg<T extends string | number>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-secondary p-1 ring-1 ring-secondary ring-inset">
      {items.map((i) => <button key={String(i.id)} onClick={() => onChange(i.id)} className={cx('rounded-md px-3 py-1.5 text-sm font-semibold transition', value === i.id ? 'bg-primary text-primary shadow-xs' : 'text-quaternary hover:text-secondary')}>{i.label}</button>)}
    </div>
  );
}
export { Seg };

export default function Trends() {
  const { a, setFocusMetric } = useApp();
  const [hz, setHz] = useState<HazardId | 'all'>('all');
  const [win, setWin] = useState(180);
  const keys = (Object.keys(METRICS) as MetricKey[]).filter((k) => hz === 'all' || METRICS[k].hazard === hz);
  return (
    <div>
      <PageHeader eyebrow="Trends" title="Your health over the mission" description="Each chart shows your daily readings, the 7-day average, and the blue band of your own pre-flight normal." actions={<DataTag />} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Seg items={[{ id: 'all' as const, label: 'All' }, ...HAZARDS.map((h) => ({ id: h.id, label: h.short }))]} value={hz} onChange={setHz} />
        <Seg items={[{ id: 30, label: '30 days' }, { id: 90, label: '90 days' }, { id: 180, label: 'Mission' }]} value={win} onChange={setWin} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {keys.map((k) => {
          const e = a.metrics[k];
          return (
            <Card key={k} title={METRICS[k].name} action={<StatusBadge s={e.status} />}>
              <button className="block w-full text-left" onClick={() => setFocusMetric(k)}>
                <div className="flex items-baseline gap-3"><span className="text-display-xs font-semibold text-primary tabular">{fmtVal(k, e.value)}</span><span className="text-sm text-tertiary">{METRICS[k].unit}</span><DeltaChip e={e} /></div>
                <div className="mt-3"><MetricChart k={k} height={170} window={win} /></div>
                <p className="mt-2 text-sm text-tertiary">{e.reasons[0] ?? 'Within your normal range.'}</p>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
