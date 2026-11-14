// Mission environments. Dose rates from published measurements:
// ISS ~0.5 mSv/day; MSL-RAD cruise to Mars 1.84 mSv/day; Mars surface (Curiosity RAD) ~0.64 mSv/day;
// Lunar surface (Chang'e-4 LND) ~1.37 mSv/day. Light-time delays from orbital distances.
export type MissionId = 'iss' | 'lunar' | 'transit' | 'mars';

export interface Mission {
  id: MissionId; name: string; place: string; gravity: number; gravityLabel: string;
  doseRate: number; speBoost: number; days: number;
  /** one-way light delay in seconds for a mission day */
  delay: (day: number) => number;
  note: string;
}

export const MISSIONS: Record<MissionId, Mission> = {
  iss: { id: 'iss', name: 'Space Station', place: 'Low Earth orbit', gravity: 0, gravityLabel: 'Microgravity',
    doseRate: 0.5, speBoost: 2, days: 180, delay: () => 0.6,
    note: 'Earth\'s magnetic field still shields the crew. Ground support is minutes away by radio.' },
  lunar: { id: 'lunar', name: 'Lunar Base', place: 'Lunar south pole', gravity: 0.166, gravityLabel: '1/6 g',
    doseRate: 1.37, speBoost: 18, days: 180, delay: () => 1.3,
    note: 'No magnetic field and no atmosphere: solar storms are a serious threat. Earth is a 1.3-second radio hop away.' },
  transit: { id: 'transit', name: 'Mars Transit', place: 'Deep space, Earth → Mars', gravity: 0, gravityLabel: 'Microgravity',
    doseRate: 1.84, speBoost: 25, days: 180,
    delay: (d) => Math.max(1, Math.min(180, d) / 180 * 660 + 2),
    note: 'The most exposed phase: highest radiation and a comms delay that grows every day. The crew is effectively on its own.' },
  mars: { id: 'mars', name: 'Mars Base', place: 'Mars surface', gravity: 0.38, gravityLabel: '0.38 g',
    doseRate: 0.64, speBoost: 4, days: 180,
    delay: (d) => 60 * (12.5 + 9.5 * Math.sin((d / 180) * Math.PI * 1.3)),
    note: 'The thin atmosphere gives some shielding. Signals take 3–22 minutes each way, so the crew handles any emergency alone.' },
};

export function fmtDelay(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)} s`;
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m} min ${s.toString().padStart(2, '0')} s`;
}
