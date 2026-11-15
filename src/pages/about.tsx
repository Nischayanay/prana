import { ArrowUpRight, ClipboardCheck, LineChartUp02, MedicalCross } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { useApp } from '@/lib/store';
import { CREW } from '@/lib/generate';
import { Card, IconBox, PageHeader } from '@/app/ui';

export const SCENES = [
  { day: 61, crew: 'watanabe', title: 'CO₂ scrubber fault', text: 'Cabin CO₂ over 4 mmHg slows the whole crew\'s reactions and raises stress.' },
  { day: 96, crew: 'rao', title: 'Solar particle event', text: 'Storm-shelter alert and a jump in dose. Try it on Mars Transit.' },
  { day: 105, crew: 'rao', title: 'Viral reactivation', text: 'Cold sores and a low fever after stress and radiation.' },
  { day: 125, crew: 'martins', title: 'Missed exercise', text: 'Resting HR up, HRV down, bone loss speeding up.' },
  { day: 140, crew: 'okafor', title: 'Isolation & sleep loss', text: 'Sleep, mood and reaction time drift from HER normal.' },
  { day: 180, crew: 'watanabe', title: 'Vision changes (SANS)', text: 'Amsler distortions plus rising blood pressure.' },
];
const LINKS = [
  ['NASA HRP: 5 Hazards of Human Spaceflight', 'https://www.nasa.gov/hrp/hazards/'],
  ['NASA HRP: Risks of Human Spaceflight', 'https://www.nasa.gov/hrp/risks/'],
  ['NASA HRP: Ongoing Research in Space', 'https://www.nasa.gov/hrp/ongoing-hrp-research/'],
  ['NASA OSDR OSD-575: Inspiration4 blood panel', 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-575'],
  ['NASA DONKI space weather (api.nasa.gov)', 'https://api.nasa.gov/'],
  ['CSA: Monitoring radiation for astronaut health', 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp'],
  ['CSA: Why do we conduct science experiments in space?', 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp'],
  ['Untitled UI React components (MIT)', 'https://github.com/untitleduico/react'],
];

export default function About() {
  const { setDay, setCrewId, setTab, resetAll } = useApp();
  return (
    <div>
      <PageHeader eyebrow="About PRANA" title="Physiological Readiness & Autonomy Network for Astronauts" description="An on-board health companion that works without Earth. It gathers health indicators, compares them with each astronaut's own normal, explains what it finds in plain language, and tells you what to do next." />
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: ClipboardCheck, t: '1. Gather', d: 'A guided 5-minute daily check: vitals with step-by-step instructions, blood sugar, mood, symptoms, a reaction-time test and a vision grid. Sensors fill in the rest.' },
          { icon: LineChartUp02, t: '2. Evaluate', d: 'Three explainable layers: NASA/clinical safety limits, YOUR pre-flight baseline (catches drift that population ranges miss), and 14-day trends for early warning. Rolled up into NASA\'s 5 hazards.' },
          { icon: MedicalCross, t: '3. Act', d: 'A plan for every finding, plus a symptom guide with danger-sign checks, self-care, medical-kit use and recheck times. Escalates from self → crew medical officer → Earth, with the real delay.' },
        ].map((x) => <Card key={x.t}><IconBox icon={x.icon} /><p className="mt-4 text-md font-semibold text-primary">{x.t}</p><p className="mt-1 text-sm text-tertiary">{x.d}</p></Card>)}
      </div>

      <Card className="mt-6" title="Guided demo" subtitle="Simulated 180-day mission with 4 fictional crew. Jump to a moment:">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCENES.map((s) => (
            <button key={s.title} onClick={() => { setDay(s.day); setCrewId(s.crew); setTab('home'); }} className="rounded-xl p-4 text-left ring-1 ring-secondary ring-inset hover:bg-primary_hover hover:ring-primary">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-primary">{s.title}</p><span className="text-xs font-medium text-brand-secondary tabular">Day {s.day}</span></div>
              <p className="mt-1 text-sm text-tertiary">{s.text}</p>
              <p className="mt-2 text-xs text-quaternary">{CREW.find((c) => c.id === s.crew)!.name}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Data & resources" bodyClassName="p-0">
          <ul className="divide-y divide-secondary">{LINKS.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="flex items-center justify-between px-5 py-3 text-sm text-secondary hover:bg-primary_hover">{t}<ArrowUpRight className="size-4 text-fg-quaternary" /></a></li>)}</ul>
          <p className="px-5 py-3 text-xs text-quaternary">Also: NASA-STD-3001 Vol 1 & 2 (600 mSv career limit, CO₂ limit); dose rates from Zeitlin 2013, Hassler 2014, Zhang 2020.</p>
        </Card>
        <Card title="Honesty notes">
          <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
            <li><b>Simulated data:</b> the 180-day crew streams are synthetic, built from published spaceflight rates, and labelled in the app.</li>
            <li><b>Real data:</b> the Evidence page uses unmodified NASA OSDR values; space weather is live from NASA DONKI.</li>
            <li><b>Use of AI:</b> code and text written with an AI assistant (Anthropic Claude), directed and reviewed by Team Yogic. No AI-generated images; no NASA logos or insignia.</li>
            <li><b>Not a medical device.</b> Thresholds and treatments are illustrative and need flight-surgeon validation.</li>
            <li><b>Privacy:</b> runs fully in the browser, works offline, and data stays on the device.</li>
          </ul>
          <Button className="mt-5" color="secondary" size="sm" onClick={() => { if (confirm('Clear entered data and XP?')) resetAll(); }}>Reset demo data</Button>
          <p className="mt-4 text-xs text-quaternary">Team Yogic · Pune · NASA Space Apps Challenge 2026</p>
        </Card>
      </div>
    </div>
  );
}
