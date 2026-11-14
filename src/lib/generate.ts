// SYNTHETIC crew data generator (clearly labelled as simulated in the UI).
// Day-by-day values are drawn around each astronaut's personal baseline, with
// spaceflight adaptations from published rates and planted mission scenarios.
// AI-assisted code (Claude), reviewed by Team Yogic.
import type { MetricKey } from './knowledge';
import { MISSIONS, type MissionId } from './missions';

export interface CrewMember {
  id: string; name: string; role: string; age: number; avatar: string;
  base: Partial<Record<MetricKey, number>>;
  story: string;
}

export const CREW: CrewMember[] = [
  { id: 'rao', name: 'Cmdr. Asha Rao', role: 'Commander', age: 41, avatar: 'AR',
    base: { hr: 58, sbp: 116, dbp: 74, hrv: 55, spo2: 98, temp: 36.6, glucose: 86, sleep: 7.0, mood: 8, stress: 3, pvt: 265, exercise: 120, mass: 62 },
    story: 'After the solar storm, stress and a weakened immune system lead to a viral reactivation (cold sores, low fever) around days 100–112.' },
  { id: 'martins', name: 'Dr. Leo Martins', role: 'Flight Engineer · Crew Medical Officer', age: 38, avatar: 'LM',
    base: { hr: 54, sbp: 122, dbp: 78, hrv: 68, spo2: 98, temp: 36.5, glucose: 90, sleep: 6.8, mood: 7, stress: 3, pvt: 255, exercise: 120, mass: 80 },
    story: 'Repair work squeezes his exercise slot (days 70–130). Bone loss speeds up, resting heart rate creeps up and HRV falls.' },
  { id: 'watanabe', name: 'Kenji Watanabe', role: 'Mission Specialist', age: 46, avatar: 'KW',
    base: { hr: 62, sbp: 128, dbp: 82, hrv: 42, spo2: 97, temp: 36.7, glucose: 89, sleep: 6.6, mood: 7, stress: 4, pvt: 280, exercise: 120, mass: 74 },
    story: 'Fluid shift toward the head: Amsler vision distortions appear from day 100 and grow, an early sign of SANS. Blood pressure slowly rises.' },
  { id: 'okafor', name: 'Dr. Amara Okafor', role: 'Science Officer', age: 34, avatar: 'AO',
    base: { hr: 60, sbp: 112, dbp: 72, hrv: 62, spo2: 98, temp: 36.6, glucose: 82, sleep: 7.3, mood: 8, stress: 3, pvt: 250, exercise: 120, mass: 66 },
    story: 'Isolation hits mid-mission (days 110–150): shorter sleep, falling mood, slower reactions. She partly recovers after acting on PRANA\'s advice.' },
];

export type DayValues = Record<MetricKey, number>;
export interface DayRecord { day: number; v: DayValues }
export const PRE_DAYS = 14; // pre-flight baseline days: -13 .. 0

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const ramp = (d: number, a: number, b: number) => (d <= a ? 0 : d >= b ? 1 : (d - a) / (b - a));
const win = (d: number, a: number, b: number) => d >= a && d <= b;

const NOISE: Partial<Record<MetricKey, number>> = {
  hr: 2.5, sbp: 4, dbp: 3, hrv: 5, spo2: 0.6, temp: 0.12, glucose: 5, sleep: 0.45, mood: 0.6,
  stress: 0.6, pvt: 14, exercise: 8, mass: 0.25,
};

export function generateMission(missionId: MissionId): Record<string, DayRecord[]> {
  const m = MISSIONS[missionId];
  const out: Record<string, DayRecord[]> = {};
  // shared cabin environment
  const envR = mulberry32(missionId.length * 991 + 7);
  const co2: number[] = [], dose: number[] = [];
  for (let d = -PRE_DAYS + 1; d <= m.days; d++) {
    let c = d <= 0 ? 0.4 + envR() * 0.1 : 1.6 + gauss(envR) * 0.25;
    if (win(d, 58, 63)) c = 3.1 + (1 - Math.abs(d - 60.5) / 3) * 1.6 + envR() * 0.2; // scrubber fault
    co2.push(Math.max(0.3, c));
    let r = d <= 0 ? 0.008 : m.doseRate * (0.88 + envR() * 0.24);
    if (d === 96) r += m.speBoost * 0.75; // solar particle event (crew sheltered)
    if (d === 97) r += m.speBoost * 0.25;
    dose.push(r);
  }

  CREW.forEach((c, ci) => {
    const r = mulberry32(1000 * (ci + 1) + missionId.charCodeAt(0));
    const recs: DayRecord[] = [];
    let bone = 0, mass = c.base.mass!, vision = 0;
    for (let d = -PRE_DAYS + 1, i = 0; d <= m.days; d++, i++) {
      const b = c.base as Record<MetricKey, number>;
      const n = (k: MetricKey) => gauss(r) * (NOISE[k] ?? 0);
      const fl = d > 0 ? 1 : 0; // in flight
      const adapt = ramp(d, 0, 30) * fl;
      const v = {} as DayValues;

      // exercise compliance
      let ex = b.exercise * (d <= 0 ? 0.5 : 1) + n('exercise');
      if (c.id === 'martins' && win(d, 70, 130)) ex = 62 + r() * 22;
      v.exercise = Math.max(0, ex);
      const compliance = Math.min(1, v.exercise / 120);

      // bone: monthly loss rate depends on gravity & exercise
      if (d > 0) {
        const gravFactor = Math.max(0.3, 1 - m.gravity * 1.3);
        const monthly = 1.25 * gravFactor * (1.45 - 0.75 * compliance);
        bone -= monthly / 30;
      }
      v.bone = bone + gauss(r) * 0.05;

      // mass: slow in-flight loss, faster if under-eating during isolation phase
      if (d > 0) mass -= 0.012 + (c.id === 'okafor' && win(d, 110, 150) ? 0.03 : 0);
      v.mass = mass + n('mass');

      const co2Hi = Math.max(0, co2[i] - 2.5);
      let hr = b.hr - 3 * adapt + n('hr');
      let hrv = b.hrv + n('hrv');
      let sbp = b.sbp - 5 * adapt + n('sbp');
      let dbp = b.dbp - 2 * adapt + n('dbp');
      let temp = b.temp + 0.25 * adapt + n('temp');
      let sleep = b.sleep - 0.3 * adapt + n('sleep');
      let mood = b.mood + n('mood');
      let stress = b.stress + n('stress') + co2Hi * 1.2;
      let pvt = b.pvt + 6 * adapt + n('pvt') + co2Hi * 28;
      let glucose = b.glucose + 3 * adapt + n('glucose');
      let spo2 = b.spo2 + n('spo2') - co2Hi * 0.4;
      let symptoms = 0;

      if (c.id === 'martins') {
        const k = ramp(d, 70, 125) * (d > 135 ? Math.max(0, 1 - (d - 135) / 30) : 1);
        hr += 11 * k; hrv -= 20 * k; stress += 1.5 * k; sleep -= 0.4 * k;
      }
      if (c.id === 'watanabe') {
        sbp += 14 * ramp(d, 90, 180); dbp += 7 * ramp(d, 90, 180);
        if (d % 7 === 0) vision = d >= 160 ? 4 : d >= 131 ? 2 : d >= 100 ? 1 : 0;
      }
      if (c.id === 'okafor') {
        const k = ramp(d, 110, 135) * (d > 150 ? Math.max(0.3, 1 - (d - 150) / 20) : 1);
        sleep -= 1.9 * k; mood -= 4.2 * k; stress += 3.2 * k; pvt += 85 * k; hrv -= 18 * k; glucose -= 6 * k;
      }
      if (c.id === 'rao') {
        if (win(d, 96, 115)) stress += 1.5;
        if (win(d, 100, 112)) symptoms = d >= 103 && d <= 108 ? 2 + (r() > 0.6 ? 1 : 0) : 1;
        if (win(d, 103, 108)) { temp += 0.95 + r() * 0.3; hr += 9; hrv -= 12; }
      }
      if (d > 0 && r() < 0.02) symptoms = Math.max(symptoms, 1); // occasional minor rash

      Object.assign(v, {
        hr, hrv: Math.max(8, hrv), sbp, dbp, temp, sleep: Math.max(3, Math.min(9.5, sleep)),
        mood: Math.max(1, Math.min(10, Math.round(mood))), stress: Math.max(1, Math.min(10, Math.round(stress))),
        pvt: Math.max(190, pvt), glucose, spo2: Math.min(100, spo2), symptoms, vision,
        co2: co2[i], dose: dose[i],
      });
      recs.push({ day: d, v });
    }
    out[c.id] = recs;
  });
  return out;
}
