// PRANA Readiness Engine: explainable, personal-baseline health assessment.
// 1) Absolute limits (clinical / NASA-STD-3001)  2) Personal baseline (pre-flight mean ± SD)
// 3) Trend (14-day linear slope). Every status comes with plain-language reasons.
// AI-assisted code (Claude), reviewed by Team Yogic.
import { HAZARDS, METRICS, PLAYBOOK, CAREER_LIMIT_MSV, type Action, type HazardId, type MetricKey } from './knowledge';
import type { DayRecord } from './generate';

export type Status = 'ok' | 'watch' | 'amber' | 'red';
export const STATUS_SCORE: Record<Status, number> = { ok: 100, watch: 80, amber: 52, red: 18 };
export const STATUS_LABEL: Record<Status, string> = { ok: 'Nominal', watch: 'Watch', amber: 'Caution', red: 'Act now' };
const RANK: Record<Status, number> = { ok: 0, watch: 1, amber: 2, red: 3 };
const worst = (a: Status, b: Status) => (RANK[a] >= RANK[b] ? a : b);

export interface Baseline { mean: number; sd: number }
export interface MetricEval {
  key: MetricKey; value: number; avg7: number; baseline: Baseline; z: number; drift: number;
  slope: number; projected14: number; status: Status; reasons: string[];
}
export interface HazardEval { id: HazardId; score: number; status: Status; metrics: MetricEval[] }
export interface Alert { key: MetricKey; status: Status; title: string; reasons: string[]; actions: Action[] }
export interface Assessment {
  day: number; readiness: number; status: Status; metrics: Record<MetricKey, MetricEval>;
  hazards: HazardEval[]; alerts: Alert[]; cumDose: number; doseRemainingPct: number;
}

const ABS_ONLY: MetricKey[] = ['co2', 'dose', 'bone', 'vision', 'symptoms', 'exercise'];
/** slow-changing or noisy metrics judged on the 7-day average, not a single day */
const AVG_ABS: MetricKey[] = ['exercise', 'sleep', 'mass', 'hrv', 'glucose', 'bone'];

export function baselineOf(recs: DayRecord[], key: MetricKey): Baseline {
  const pre = recs.filter((r) => r.day <= 0).map((r) => r.v[key]);
  const mean = pre.reduce((a, b) => a + b, 0) / Math.max(1, pre.length);
  const sd = Math.sqrt(pre.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, pre.length - 1));
  return { mean, sd: Math.max(sd, METRICS[key].minDelta / 2) };
}

function slopeOf(ys: number[]): number {
  const n = ys.length; if (n < 3) return 0;
  const mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  ys.forEach((y, i) => { num += (i - mx) * (y - my); den += (i - mx) ** 2; });
  return num / den;
}

const fmt = (k: MetricKey, x: number) => `${x.toFixed(METRICS[k].decimals)} ${METRICS[k].unit}`;

export function evaluateMetric(recs: DayRecord[], key: MetricKey, day: number): MetricEval {
  const m = METRICS[key];
  const idx = recs.findIndex((r) => r.day === day);
  const upto = recs.slice(0, idx + 1);
  const value = upto[upto.length - 1].v[key];
  const last7 = upto.slice(-7).map((r) => r.v[key]);
  const avg7 = last7.reduce((a, b) => a + b, 0) / last7.length;
  const baseline = baselineOf(recs, key);
  const z = (avg7 - baseline.mean) / baseline.sd;
  const drift = avg7 - baseline.mean;
  const slope = slopeOf(upto.slice(-14).map((r) => r.v[key]));
  const projected14 = slope * 14;
  const reasons: string[] = [];
  let status: Status = 'ok';

  // 1. absolute limits — today's value, and also the 7-day average for slow metrics
  const check = (x: number, label: string) => {
    if (m.highRed !== undefined && x >= m.highRed) { status = worst(status, 'red'); reasons.push(`${label} ${fmt(key, x)} is above the safety limit (${fmt(key, m.highRed)}).`); }
    else if (m.highAmber !== undefined && x > m.highAmber) { status = worst(status, 'amber'); reasons.push(`${label} ${fmt(key, x)} is above the normal range (${fmt(key, m.highAmber)}).`); }
    if (m.lowRed !== undefined && x <= m.lowRed) { status = worst(status, 'red'); reasons.push(`${label} ${fmt(key, x)} is below the safety limit (${fmt(key, m.lowRed)}).`); }
    else if (m.lowAmber !== undefined && x < m.lowAmber) { status = worst(status, 'amber'); reasons.push(`${label} ${fmt(key, x)} is below the normal range (${fmt(key, m.lowAmber)}).`); }
  };
  if (AVG_ABS.includes(key)) {
    check(avg7, '7-day average');
    // a single dangerous day still counts (e.g. one hypoglycaemic reading)
    if (m.lowRed !== undefined && value <= m.lowRed) check(value, 'Today\'s reading');
    if (m.highRed !== undefined && value >= m.highRed) check(value, 'Today\'s reading');
  } else check(value, 'Today\'s reading');

  // 2. personal baseline drift (the n-of-1 part)
  if (!ABS_ONLY.includes(key)) {
    const badDir = m.bad === 'both' || (m.bad === 'up' ? drift > 0 : drift < 0);
    if (badDir && Math.abs(drift) >= m.minDelta && Math.abs(z) >= 2) {
      const big = Math.abs(drift) >= m.minDelta * 2.6 && Math.abs(z) >= 3.5;
      status = worst(status, big ? 'red' : 'amber');
      reasons.push(`Your 7-day average (${fmt(key, avg7)}) is ${Math.abs(drift).toFixed(m.decimals || 1)} ${m.unit} ${drift > 0 ? 'above' : 'below'} YOUR pre-flight normal of ${fmt(key, baseline.mean)}: ${Math.abs(z).toFixed(1)}× your usual variation.`);
    }
  }

  // 3. trend: early warning before limits are crossed
  const trendBad = m.bad === 'both' ? true : m.bad === 'up' ? projected14 > 0 : projected14 < 0;
  if (key !== 'dose' && key !== 'co2' && trendBad && Math.abs(projected14) >= m.minDelta * 1.2) {
    if (status === 'ok') status = 'watch';
    reasons.push(`Trend: ${projected14 > 0 ? 'rising' : 'falling'} about ${Math.abs(projected14).toFixed(m.decimals || 1)} ${m.unit} every 2 weeks.`);
  }
  return { key, value, avg7, baseline, z, drift, slope, projected14, status, reasons };
}

export function assess(recs: DayRecord[], day: number): Assessment {
  const metrics = {} as Record<MetricKey, MetricEval>;
  (Object.keys(METRICS) as MetricKey[]).forEach((k) => { metrics[k] = evaluateMetric(recs, k, day); });

  const cumDose = recs.filter((r) => r.day > 0 && r.day <= day).reduce((a, r) => a + r.v.dose, 0);
  const doseRemainingPct = Math.max(0, 100 - (cumDose / CAREER_LIMIT_MSV) * 100);
  // cumulative dose rolls into the radiation hazard
  if (cumDose > CAREER_LIMIT_MSV * 0.5) {
    const d = metrics.dose;
    d.status = worst(d.status, cumDose > CAREER_LIMIT_MSV * 0.8 ? 'red' : 'amber');
    d.reasons.push(`Mission dose so far ${cumDose.toFixed(0)} mSv is ${(cumDose / CAREER_LIMIT_MSV * 100).toFixed(0)}% of the 600 mSv career limit.`);
  }

  const hazards: HazardEval[] = HAZARDS.map((h) => {
    const ms = Object.values(metrics).filter((e) => METRICS[e.key].hazard === h.id);
    const scores = ms.map((e) => STATUS_SCORE[e.status]);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const score = Math.round(0.55 * mean + 0.45 * min);
    const status = ms.reduce<Status>((s, e) => worst(s, e.status), 'ok');
    return { id: h.id, score, status, metrics: ms };
  });
  const hMean = hazards.reduce((a, h) => a + h.score, 0) / hazards.length;
  const readiness = Math.round(0.6 * hMean + 0.4 * Math.min(...hazards.map((h) => h.score)));
  const status: Status = hazards.reduce<Status>((s, h) => worst(s, h.status), 'ok');

  const alerts: Alert[] = Object.values(metrics)
    .filter((e) => e.status !== 'ok')
    .sort((a, b) => RANK[b.status] - RANK[a.status])
    .map((e) => {
      const pb = PLAYBOOK[e.key];
      const actions = e.status === 'red' ? pb : e.status === 'amber' ? pb.filter((a) => a.level !== 'ground') : pb.slice(0, 1);
      return { key: e.key, status: e.status, title: METRICS[e.key].name, reasons: e.reasons, actions };
    });

  return { day, readiness, status, metrics, hazards, alerts, cumDose, doseRemainingPct };
}

export const STATUS_COLOR: Record<Status, string> = {
  ok: 'var(--ok)', watch: 'var(--watch)', amber: 'var(--amber)', red: 'var(--red)',
};
