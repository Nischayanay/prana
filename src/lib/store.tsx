// App state: mission, crew member, mission day, astronaut-entered data (stored locally
// on the device, never sent anywhere), routine/gamification progress.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CREW, generateMission, type DayRecord, type DayValues } from './generate';
import { assess, type Assessment } from './engine';
import { MISSIONS, type MissionId } from './missions';
import type { MetricKey } from './knowledge';

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full or blocked */ } }, [key, v]);
  return [v, setV] as const;
}

type Overrides = Record<string, Partial<DayValues>>; // key: mission:crew:day
export interface Progress { done: Record<string, boolean>; xp: number }

interface Ctx {
  mission: MissionId; setMission: (m: MissionId) => void;
  crewId: string; setCrewId: (c: string) => void;
  day: number; setDay: (d: number) => void;
  records: DayRecord[]; allRecords: Record<string, DayRecord[]>;
  a: Assessment; crewAssess: Record<string, Assessment>;
  logValues: (vals: Partial<DayValues>) => void; entered: Partial<DayValues>;
  progress: Progress; toggleDone: (id: string, xp?: number) => void;
  focusMetric: MetricKey | null; setFocusMetric: (k: MetricKey | null) => void;
  tab: string; setTab: (t: string) => void;
  resetAll: () => void;
}
const C = createContext<Ctx | null>(null);
export const useApp = () => useContext(C)!;

export function AppProvider({ children }: { children: ReactNode }) {
  const [mission, setMission] = useLocal<MissionId>('prana.mission', 'transit');
  const [crewId, setCrewId] = useLocal('prana.crew', 'okafor');
  const [day, setDayRaw] = useLocal('prana.day', 140);
  const [overrides, setOverrides] = useLocal<Overrides>('prana.overrides', {});
  const [progress, setProgress] = useLocal<Progress>('prana.progress', { done: {}, xp: 0 });
  const [focusMetric, setFocusMetric] = useState<MetricKey | null>(null);
  const [tab, setTab] = useState('today');

  const generated = useMemo(() => generateMission(mission), [mission]);
  const allRecords = useMemo(() => {
    const out: Record<string, DayRecord[]> = {};
    for (const c of CREW) {
      out[c.id] = generated[c.id].map((r) => {
        const o = overrides[`${mission}:${c.id}:${r.day}`];
        return o ? { day: r.day, v: { ...r.v, ...o } } : r;
      });
    }
    return out;
  }, [generated, overrides, mission]);
  const setDay = (d: number) => setDayRaw(Math.max(1, Math.min(MISSIONS[mission].days, Math.round(d))));
  const records = allRecords[crewId] ?? allRecords[CREW[0].id];
  const crewAssess = useMemo(() => Object.fromEntries(CREW.map((c) => [c.id, assess(allRecords[c.id], day)])), [allRecords, day]);
  const a = crewAssess[crewId] ?? crewAssess[CREW[0].id];
  const okey = `${mission}:${crewId}:${day}`;
  const entered = overrides[okey] ?? {};

  const value: Ctx = {
    mission, setMission, crewId, setCrewId, day, setDay, records, allRecords, a, crewAssess,
    entered,
    logValues: (vals) => setOverrides((o) => ({ ...o, [okey]: { ...(o[okey] ?? {}), ...vals } })),
    progress,
    toggleDone: (id, xp = 10) => setProgress((p) => {
      const was = !!p.done[id];
      return { done: { ...p.done, [id]: !was }, xp: Math.max(0, p.xp + (was ? -xp : xp)) };
    }),
    focusMetric, setFocusMetric, tab, setTab,
    resetAll: () => { setOverrides({}); setProgress({ done: {}, xp: 0 }); },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
