import { useApp } from '../lib/store';
import { CREW } from '../lib/generate';

const SCENES = [
  { day: 61, crew: 'watanabe', title: 'CO₂ scrubber fault', text: 'Cabin CO₂ above 4 mmHg: the whole crew\'s reaction times slow down and stress rises.' },
  { day: 96, crew: 'rao', title: 'Solar particle event', text: 'Radiation alert, storm-shelter protocol, a jump in dose (deep-space missions).' },
  { day: 105, crew: 'rao', title: 'Immune: viral reactivation', text: 'Cold sores + low fever after stress & radiation. PRANA suggests isolation and the CMO.' },
  { day: 125, crew: 'martins', title: 'Missed exercise → deconditioning', text: 'Resting HR up, HRV down, bone loss speeding up.' },
  { day: 140, crew: 'okafor', title: 'Isolation & sleep loss', text: 'Sleep, mood and reaction time drift away from HER normal before any classic limit is crossed.' },
  { day: 180, crew: 'watanabe', title: 'Vision changes (SANS)', text: 'Amsler distortions + rising blood pressure → eye ultrasound and a ground consult.' },
];

export default function About() {
  const { setDay, setCrewId, setTab, resetAll } = useApp();
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="card pad-lg">
        <div className="upper">About</div>
        <h2>PRANA: Physiological Readiness &amp; Autonomy Network for Astronauts</h2>
        <p className="muted" style={{ maxWidth: 820 }}>On the way to Mars, a question to a flight surgeon can take 40 minutes to answer. PRANA is an <b>offline-first, on-board health companion</b>: it gathers health indicators from sensors, short check-ins and self-tests, compares them with <b>each astronaut's own normal</b>, explains every finding in plain language, and turns it into a concrete action, from "drink water and retest" to "consult Earth".</p>
        <div className="grid g3 mt">
          <div className="tile" style={{ cursor: 'default' }}><b>1 · Sense</b><p className="small muted">Wearable/cabin sensors (HR, HRV, BP, SpO₂, temperature, sleep, dose, CO₂), a 60-second check-in (mood, stress, symptoms) and in-app tests (PVT reaction time, Amsler vision grid).</p></div>
          <div className="tile" style={{ cursor: 'default' }}><b>2 · Understand</b><p className="small muted">Three explainable layers: <b>safety limits</b> (NASA-STD-3001 / clinical), <b>personal baseline</b> (pre-flight mean ± SD, catches drift that population ranges miss) and <b>trend</b> (14-day slope, early warning). Rolled up into the 5 NASA hazards and one Readiness score.</p></div>
          <div className="tile" style={{ cursor: 'default' }}><b>3 · Act</b><p className="small muted">A countermeasure playbook for every indicator, with three escalation levels: do it yourself → involve crew / CMO → consult Earth (delay-aware). The astronaut controls what is shared.</p></div>
        </div>
      </div>

      <div className="card pad-lg">
        <div className="row between"><h3>Guided demo: jump to a scenario</h3><span className="tag sim">simulated 180-day mission</span></div>
        <div className="grid g3 mt">
          {SCENES.map((s) => (
            <button key={s.title} className="tile" onClick={() => { setDay(s.day); setCrewId(s.crew); setTab('today'); }}>
              <div className="row between"><b>{s.title}</b><span className="tag num">day {s.day}</span></div>
              <div className="small muted" style={{ marginTop: 4 }}>{s.text}</div>
              <div className="tiny dim" style={{ marginTop: 4 }}>{CREW.find((c) => c.id === s.crew)!.name} →</div>
            </button>
          ))}
        </div>
        <div className="mt small muted">Crew stories:</div>
        <ul className="small muted" style={{ paddingLeft: 18 }}>{CREW.map((c) => <li key={c.id}><b>{c.name}</b> ({c.role}): {c.story}</li>)}</ul>
      </div>

      <div className="grid g2">
        <div className="card pad-lg">
          <h3>Data & resources</h3>
          <ul className="small" style={{ paddingLeft: 18 }}>
            <li><a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">NASA HRP: 5 Hazards of Human Spaceflight</a>: structure of the dashboard</li>
            <li><a href="https://www.nasa.gov/hrp/risks/" target="_blank" rel="noreferrer">NASA HRP: Risks of Human Spaceflight</a>: indicators, explanations, countermeasures</li>
            <li><a href="https://www.nasa.gov/hrp/ongoing-hrp-research/" target="_blank" rel="noreferrer">NASA HRP: Ongoing research in space</a>: what can be measured on board</li>
            <li><a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-575" target="_blank" rel="noreferrer">NASA OSDR OSD-575: Inspiration4 metabolic panel</a>: <b>real crew data</b> view</li>
            <li><a href="https://api.nasa.gov/" target="_blank" rel="noreferrer">NASA DONKI space-weather notifications (api.nasa.gov)</a>: live radiation alerts</li>
            <li>NASA-STD-3001 Vol. 1 & 2: radiation career limit (600 mSv), CO₂ limit</li>
            <li><a href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" target="_blank" rel="noreferrer">CSA: Monitoring radiation for astronaut health</a></li>
            <li>Published dose rates: MSL-RAD cruise (Zeitlin 2013), Curiosity RAD surface (Hassler 2014), Chang'e-4 LND (Zhang 2020)</li>
          </ul>
        </div>
        <div className="card pad-lg">
          <h3>Honesty notes</h3>
          <ul className="small muted" style={{ paddingLeft: 18 }}>
            <li><b>Simulated data:</b> the 180-day crew streams are synthetic, generated from published spaceflight rates (e.g. 1–1.5 %/month hip bone loss). Labelled "SIMULATED" in the app.</li>
            <li><b>Real data:</b> the Inspiration4 view uses unmodified NASA OSDR values.</li>
            <li><b>Use of AI (Super Intelligence):</b> code and text were written with help from an AI assistant (Anthropic Claude) and reviewed by Team Yogic. No AI-generated images; no NASA logos or insignia used.</li>
            <li><b>Not a medical device.</b> A decision-support prototype; thresholds are illustrative and would need flight-surgeon validation.</li>
            <li><b>Privacy:</b> everything runs in your browser; check-ins stay in local storage on your device.</li>
          </ul>
          <button className="btn ghost mt" onClick={() => { if (confirm('Clear all entered check-ins, tests and XP?')) resetAll(); }}>Reset my demo data</button>
          <p className="tiny dim mt">Team Yogic · Pune · NASA Space Apps Challenge 2026</p>
        </div>
      </div>
    </div>
  );
}
