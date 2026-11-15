// Symptom guide: step-by-step self-assessment and treatment for common spaceflight complaints.
// Red flags → escalate immediately. Content summarised from NASA HRP risk pages and spaceflight
// medicine literature; illustrative, to be validated by flight surgeons. AI-assisted (Claude).
import { useState, type FC } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Eye, FaceSad, HeartRounded, MedicalCross, Moon01, Send01, Thermometer02, Wind01, Zap } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { useApp } from '@/lib/store';
import { METRICS, type MetricKey } from '@/lib/knowledge';
import { cx } from '@/utils/cx';
import { Card, IconBox, PageHeader, StatusBadge, fmtVal } from '@/app/ui';

interface Guide {
  id: string; name: string; icon: FC<{ className?: string }>; common: string; why: string;
  redFlags: string[]; selfCare: string[]; kit: string; recheck: string; related: MetricKey[];
}

const GUIDES: Guide[] = [
  { id: 'sms', name: 'Nausea / space motion sickness', icon: Wind01, common: 'Affects ~70% of crew in the first 2–3 days',
    why: 'Your inner ear and eyes disagree about which way is "up" in weightlessness. It usually settles within 72 hours.',
    redFlags: ['Vomiting for more than 24 hours', 'Can\'t keep any fluids down', 'Severe abdominal pain', 'Confusion or very drowsy'],
    selfCare: ['Keep your head still; align your body with a "visual up" (lights, labels)', 'Avoid fast head movements and somersaults for 2–3 days', 'Small frequent sips of water and bland snacks', 'Rest with eyes closed in your crew quarters'],
    kit: 'Anti-nausea medication from the medical kit (promethazine has been used in spaceflight). It causes drowsiness: no critical tasks for 6 h after.',
    recheck: 'Re-assess in 6 hours. Log fluid intake.', related: ['hr', 'mass'] },
  { id: 'headache', name: 'Headache', icon: Zap, common: 'One of the most frequent complaints on the ISS',
    why: 'Fluid shifts toward the head and raised CO₂ in poorly ventilated areas are the usual causes. Poor sleep and dehydration add to it.',
    redFlags: ['Sudden "worst-ever" headache', 'Headache with vision change or weakness', 'Headache with fever and stiff neck', 'After a blow to the head'],
    selfCare: ['Check cabin CO₂ and move near a ventilation fan', 'Drink 500 mL of water', 'Rest 20 minutes with lights dimmed', 'If it repeats daily, run the Amsler vision check (SANS)'],
    kit: 'Paracetamol (acetaminophen) or ibuprofen per the on-board medical checklist.',
    recheck: 'If not better in 2 hours, or it keeps coming back, tell your CMO.', related: ['co2', 'sleep', 'sbp', 'vision'] },
  { id: 'back', name: 'Back pain', icon: HeartRounded, common: 'Over half of crew in the first weeks',
    why: 'Without gravity your spine lengthens by up to 5 cm and the deep back muscles weaken, which strains the lower back.',
    redFlags: ['Numbness or weakness in the legs', 'Loss of bladder or bowel control', 'Pain after a strike or fall during EVA/exercise'],
    selfCare: ['Sleep or rest in a fetal (knees-to-chest) position', 'Gentle stretching: knees to chest, 3 × 30 s', 'Keep doing resistance exercise with correct form', 'Use foot restraints to brace your posture while working'],
    kit: 'Ibuprofen or paracetamol per the medical checklist; heat pack if available.',
    recheck: 'Re-assess tomorrow at your daily check.', related: ['exercise', 'bone'] },
  { id: 'congestion', name: 'Stuffy nose / sinus pressure', icon: Wind01, common: 'Very common: the "puffy face" of spaceflight',
    why: 'Fluid moves toward your head, so your face and nasal lining swell. Dry cabin air makes it worse.',
    redFlags: ['High fever with facial pain', 'Nosebleed that won\'t stop after 20 minutes of pressure'],
    selfCare: ['Saline nasal rinse or spray', 'Drink enough fluids', 'Raise your head end in the sleeping bag'],
    kit: 'Decongestant nasal spray (no more than 3 days) per the medical checklist.',
    recheck: 'Check body temperature tonight to rule out infection.', related: ['temp'] },
  { id: 'insomnia', name: 'Can\'t sleep', icon: Moon01, common: 'Crew average ~6 h sleep per night',
    why: 'Sixteen sunrises a day, noise, CO₂, stress and schedule shifts disrupt the body clock.',
    redFlags: ['Under 4 hours for 3+ nights', 'Feeling hopeless or not yourself'],
    selfCare: ['Fixed sleep window, ±30 min', 'Dim warm light 1 h before; bright blue light in the morning', 'Eye mask, earplugs, ventilation fan on', 'No caffeine 6 h before sleep'],
    kit: 'Short-acting sleep aid per the medical checklist. Not within 8 h of a critical task; never on 2 nights before EVA.',
    recheck: 'Run the reaction test tomorrow morning before critical work.', related: ['sleep', 'pvt', 'mood'] },
  { id: 'rash', name: 'Skin rash / irritation', icon: MedicalCross, common: 'The most common medical event on the ISS',
    why: 'Immune changes, dry air, sweat that doesn\'t drip and limited washing irritate the skin. Dormant viruses can reactivate.',
    redFlags: ['Painful blisters in a band on one side (shingles)', 'Rash with fever', 'Spreading redness, warmth or pus'],
    selfCare: ['Clean with rinse-less wipes and dry gently', 'Moisturise twice a day', 'Wear clean, loose clothing', 'Photograph the rash daily to track it'],
    kit: 'Hydrocortisone cream; antiviral tablets if the CMO suspects herpes/shingles.',
    recheck: 'Photograph again in 24 h and compare.', related: ['symptoms', 'temp'] },
  { id: 'eye', name: 'Eye irritation / something in eye', icon: Eye, common: 'Floating debris is a frequent cause',
    why: 'In weightlessness dust and particles don\'t settle; they float and get into your eyes.',
    redFlags: ['Change in vision', 'Severe pain or light sensitivity', 'Chemical splash'],
    selfCare: ['Don\'t rub', 'Flush with the eye-wash kit for 15 minutes', 'Check your Amsler grid once it settles'],
    kit: 'Eye-wash kit and lubricating drops; antibiotic drops only if the CMO prescribes.',
    recheck: 'If symptoms last over 24 h, the CMO examines with the stain kit/ultrasound.', related: ['vision'] },
  { id: 'fever', name: 'Fever / feeling ill', icon: Thermometer02, common: 'Immune function is weaker in flight',
    why: 'Stress, radiation and the closed environment weaken immunity, and an infection spreads easily in a small crew.',
    redFlags: ['Temperature at or above 39 °C', 'Breathing difficulty or SpO₂ under 92%', 'Chest pain', 'Confusion'],
    selfCare: ['Take your temperature and SpO₂ now', 'Wear a mask in shared modules', 'Rest and drink fluids', 'Wipe down shared surfaces'],
    kit: 'Paracetamol for fever; antibiotics only after a CMO assessment.',
    recheck: 'Temperature every 4 hours. Log each reading in today\'s check.', related: ['temp', 'spo2', 'hr', 'symptoms'] },
  { id: 'low', name: 'Feeling low / anxious', icon: FaceSad, common: 'Isolation affects everyone at some point',
    why: 'Confinement, monotony, distance from family and a delayed link to Earth wear down mood. Early support works best.',
    redFlags: ['Thoughts of harming yourself', 'Unable to function for several days'],
    selfCare: ['Talk to a crewmate you trust', 'Schedule a call or video message home', '10 minutes of slow breathing (4 s in, 6 s out)', 'Earth observation, music, plant care: 30 min protected time'],
    kit: 'No medication without a ground psychiatrist consult.',
    recheck: 'Book a private session with the ground psychologist (delay-tolerant).', related: ['mood', 'stress', 'sleep', 'hrv'] },
];

export default function Treat() {
  const { a, setTab, setFocusMetric, toggleDone, progress, mission, crewId, day } = useApp();
  const [gid, setGid] = useState(GUIDES[1].id);
  const [flags, setFlags] = useState<string[]>([]);
  const g = GUIDES.find((x) => x.id === gid)!;
  const urgent = flags.length > 0;
  const pick = (id: string) => { setGid(id); setFlags([]); };

  return (
    <div>
      <PageHeader eyebrow="Symptom guide" title="What's bothering you?" description="Pick a symptom. PRANA checks for danger signs first, then walks you through self-care, the medical kit and when to recheck." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          {GUIDES.map((x) => (
            <button key={x.id} onClick={() => pick(x.id)} className={cx('flex w-full items-center gap-3 rounded-xl bg-primary p-3 text-left ring-1 ring-inset transition', gid === x.id ? 'ring-2 ring-brand' : 'ring-secondary hover:ring-primary')}>
              <IconBox icon={x.icon} size="sm" color={gid === x.id ? 'brand' : 'gray'} />
              <div className="min-w-0"><p className="text-sm font-semibold text-primary">{x.name}</p><p className="truncate text-xs text-tertiary">{x.common}</p></div>
            </button>
          ))}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title={g.name} subtitle={g.why}>
            <p className="mb-3 text-sm font-semibold text-primary">Step 1: Do you have any of these danger signs?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.redFlags.map((f) => <Checkbox key={f} size="md" label={f} isSelected={flags.includes(f)} onChange={(on) => setFlags(on ? [...flags, f] : flags.filter((x) => x !== f))} />)}
            </div>
            {urgent ? (
              <div className="mt-5 flex flex-col gap-4 rounded-xl bg-error-primary p-4 ring-1 ring-error_subtle ring-inset sm:flex-row sm:items-center">
                <IconBox icon={AlertTriangle} color="error" />
                <div className="flex-1"><p className="text-sm font-semibold text-error-primary">Stop. Get help now.</p><p className="text-sm text-secondary">Alert your Crew Medical Officer immediately. They'll follow the emergency medical checklist and contact the flight surgeon. Don't wait for a reply from Earth before acting.</p></div>
                <Button color="primary-destructive" size="sm" iconLeading={Send01} onClick={() => setTab('comms')}>Alert ground</Button>
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-success-primary"><CheckCircle className="size-4" /> No danger signs. You can safely start with self-care.</p>
            )}
          </Card>

          <div className={cx('grid gap-6 md:grid-cols-2', urgent && 'opacity-60')}>
            <Card title="Step 2: Self-care now" bodyClassName="p-0">
              <ul className="divide-y divide-secondary">
                {g.selfCare.map((s, i) => {
                  const id = `treat:${mission}:${crewId}:${day}:${g.id}:${i}`;
                  return <li key={i} className="px-5 py-3"><Checkbox isSelected={!!progress.done[id]} onChange={() => toggleDone(id, 5)} label={<span className={progress.done[id] ? 'text-tertiary line-through' : ''}>{s}</span>} /></li>;
                })}
              </ul>
            </Card>
            <div className="space-y-6">
              <Card title="Step 3: Medical kit">
                <p className="text-sm text-secondary">{g.kit}</p>
                <div className="mt-3"><BadgeWithDot type="pill-color" color="warning" size="sm">Confirm with your Crew Medical Officer</BadgeWithDot></div>
              </Card>
              <Card title="Step 4: Recheck">
                <p className="flex gap-2 text-sm text-secondary"><Clock className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />{g.recheck}</p>
                <Button className="mt-4" color="secondary" size="sm" iconTrailing={ArrowRight} onClick={() => setTab('check')}>Log in today's check</Button>
              </Card>
            </div>
          </div>

          <Card title="Related readings" subtitle="What your data says right now">
            <div className="grid gap-3 sm:grid-cols-2">
              {g.related.map((k) => (
                <button key={k} onClick={() => setFocusMetric(k)} className="flex items-center justify-between rounded-lg p-3 text-left ring-1 ring-secondary ring-inset hover:bg-primary_hover">
                  <span className="text-sm text-secondary">{METRICS[k].name}</span>
                  <span className="flex items-center gap-2"><span className="text-sm font-semibold tabular text-primary">{fmtVal(k, a.metrics[k].value)} {METRICS[k].unit}</span><StatusBadge s={a.metrics[k].status} /></span>
                </button>
              ))}
            </div>
          </Card>
          <p className="text-xs text-quaternary">Decision-support prototype. Treatments are illustrative and must follow the mission's medical checklist and flight-surgeon protocols.</p>
        </div>
      </div>
    </div>
  );
}
