import { useState } from 'react';
import { useApp } from '@/lib/store';
import { METRICS, ORGANS, type OrganId } from '@/lib/knowledge';
import type { Status } from '@/lib/engine';
import { cx } from '@/utils/cx';
import { Card, DeltaChip, PageHeader, STATUS, StatusBadge, fmtVal } from '@/app/ui';

const RANK: Record<Status, number> = { ok: 0, watch: 1, amber: 2, red: 3 };

export default function Body() {
  const { a, setFocusMetric } = useApp();
  const [sel, setSel] = useState<OrganId>('heart');
  const statusOf = (o: OrganId): Status => ORGANS[o].metrics.reduce<Status>((s, k) => (RANK[a.metrics[k].status] > RANK[s] ? a.metrics[k].status : s), 'ok');
  const fill = (o: OrganId) => STATUS[statusOf(o)].hex;
  const P = (o: OrganId) => ({ className: 'body-part', 'data-selected': sel === o, onClick: () => setSel(o), role: 'button', 'aria-label': ORGANS[o].name, tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') setSel(o); } });
  const organ = ORGANS[sel];

  return (
    <div>
      <PageHeader eyebrow="Body status" title="How each body system is coping" description="Tap a part of the body to see its indicators, what spaceflight does to it, and what to do." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" bodyClassName="flex flex-col items-center">
          <svg viewBox="0 0 300 560" className="w-full max-w-[300px]">
            <defs><radialGradient id="aura" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor={fill('immune')} stopOpacity="0.18" /><stop offset="1" stopColor={fill('immune')} stopOpacity="0" /></radialGradient></defs>
            <ellipse cx="150" cy="280" rx="148" ry="275" fill="url(#aura)" {...P('immune')} />
            <g fill="#F2F4F7" stroke="#D0D5DD" strokeWidth="1.5">
              <circle cx="150" cy="62" r="40" />
              <rect x="136" y="98" width="28" height="22" rx="6" />
              <path d="M92 124 Q150 108 208 124 L222 300 Q150 318 78 300 Z" />
              <path d="M92 128 L58 250 L44 360 L62 364 L84 262 L104 170 Z" />
              <path d="M208 128 L242 250 L256 360 L238 364 L216 262 L196 170 Z" />
              <path d="M84 300 L80 420 L92 540 L130 540 L140 420 L150 330 L160 420 L170 540 L208 540 L220 420 L216 300 Q150 318 84 300 Z" />
            </g>
            <path d="M118 52 Q120 26 150 24 Q180 26 182 52 Q170 46 150 48 Q130 46 118 52 Z" fill={fill('brain')} {...P('brain')} />
            <g {...P('eyes')}><ellipse cx="136" cy="66" rx="8" ry="5" fill={fill('eyes')} /><ellipse cx="164" cy="66" rx="8" ry="5" fill={fill('eyes')} /></g>
            <g {...P('lungs')} opacity="0.9"><path d="M112 140 Q100 190 108 228 L138 222 L140 146 Z" fill={fill('lungs')} /><path d="M188 140 Q200 190 192 228 L162 222 L160 146 Z" fill={fill('lungs')} /></g>
            <path d="M150 196 C140 184 124 186 126 200 C128 212 150 224 150 224 C150 224 172 212 174 200 C176 186 160 184 150 196 Z" fill={fill('heart')} {...P('heart')} />
            <ellipse cx="150" cy="262" rx="30" ry="20" fill={fill('metabolism')} opacity="0.9" {...P('metabolism')} />
            <g {...P('muscles')} opacity="0.85">
              <path d="M78 170 L62 250 L76 254 L94 180 Z" fill={fill('muscles')} /><path d="M222 170 L238 250 L224 254 L206 180 Z" fill={fill('muscles')} />
              <path d="M98 330 L94 410 L130 410 L138 340 Z" fill={fill('muscles')} /><path d="M202 330 L206 410 L170 410 L162 340 Z" fill={fill('muscles')} />
            </g>
            <g {...P('bones')}>
              <path d="M104 296 Q150 284 196 296 L190 316 Q150 306 110 316 Z" fill={fill('bones')} />
              <rect x="104" y="430" width="14" height="96" rx="6" fill={fill('bones')} /><rect x="182" y="430" width="14" height="96" rx="6" fill={fill('bones')} />
            </g>
          </svg>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-tertiary">
            {(['ok', 'watch', 'amber', 'red'] as Status[]).map((s) => <span key={s} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: STATUS[s].hex }} />{STATUS[s].label}</span>)}
            <span>· glow = immune system</span>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card title={organ.name} subtitle={organ.blurb} action={<StatusBadge s={statusOf(sel)} size="md" />} bodyClassName="p-0">
            <ul className="divide-y divide-secondary">
              {organ.metrics.map((k) => {
                const e = a.metrics[k];
                return (
                  <li key={k}><button onClick={() => setFocusMetric(k)} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-primary_hover">
                    <div className="min-w-0"><p className="text-sm font-semibold text-primary">{METRICS[k].name}</p><p className="mt-0.5 text-sm text-tertiary">{e.reasons[0] ?? 'Within your normal range.'}</p></div>
                    <div className="shrink-0 text-right"><p className="text-lg font-semibold text-primary tabular">{fmtVal(k, e.value)} <span className="text-sm font-normal text-tertiary">{METRICS[k].unit}</span></p><DeltaChip e={e} /></div>
                  </button></li>
                );
              })}
            </ul>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(ORGANS) as OrganId[]).map((o) => (
              <button key={o} onClick={() => setSel(o)} className={cx('flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-left text-sm font-medium ring-1 ring-inset', sel === o ? 'text-brand-secondary ring-2 ring-brand' : 'text-secondary ring-secondary hover:ring-primary')}>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: fill(o) }} />{ORGANS[o].name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
