import { generateMission, CREW } from '../src/lib/generate';
import { assess } from '../src/lib/engine';
for (const mid of ['iss','transit'] as const) {
  const data = generateMission(mid);
  console.log('=== ', mid);
  for (const c of CREW) for (const day of [30, 61, 97, 105, 125, 140, 180]) {
    const a = assess(data[c.id], day);
    console.log(c.id.padEnd(9), String(day).padStart(3), 'R', a.readiness, a.status.padEnd(5), 'dose', a.cumDose.toFixed(0), a.alerts.map(x=>x.key+':'+x.status).join(' '));
  }
}
