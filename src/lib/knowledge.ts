// PRANA knowledge base: health indicators, the NASA HRP hazards they map to,
// how to measure them in space, and countermeasures.
// Sources: NASA Human Research Program (nasa.gov/hrp/hazards, nasa.gov/hrp/risks),
// NASA-STD-3001 Vol 1 & 2, published spaceflight physiology literature.
// Written with AI assistance (Claude) and reviewed by Team Yogic. Not a medical device.

export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment';
export type OrganId = 'brain' | 'eyes' | 'heart' | 'lungs' | 'bones' | 'muscles' | 'immune' | 'metabolism';
export type MetricKey =
  | 'hr' | 'sbp' | 'dbp' | 'hrv' | 'spo2' | 'temp' | 'glucose' | 'sleep' | 'mood' | 'stress'
  | 'pvt' | 'exercise' | 'mass' | 'bone' | 'vision' | 'symptoms' | 'co2' | 'dose';

export interface Hazard {
  id: HazardId; name: string; short: string; icon: string; blurb: string; risks: string[];
}

export const HAZARDS: Hazard[] = [
  { id: 'radiation', name: 'Space Radiation', short: 'Radiation', icon: '☢',
    blurb: 'Outside Earth\'s magnetic field, galactic cosmic rays and solar particle events raise long-term cancer risk and can damage the nervous system and immune cells.',
    risks: ['Cancer risk', 'Central nervous system effects', 'Acute radiation syndrome during solar storms'] },
  { id: 'isolation', name: 'Isolation & Confinement', short: 'Isolation', icon: '◎',
    blurb: 'Months in a small crew, far from family, with disturbed light/dark cycles, affect sleep, mood, alertness and teamwork.',
    risks: ['Behavioral health decline', 'Sleep loss & circadian misalignment', 'Slower reactions (fatigue)'] },
  { id: 'distance', name: 'Distance from Earth', short: 'Distance', icon: '⟿',
    blurb: 'Mars is up to 22 light-minutes away. No quick rescue, delayed advice from flight surgeons and a limited food supply: the crew must manage their own health.',
    risks: ['Limited medical care on board', 'Inadequate nutrition', 'Communication delay to ground'] },
  { id: 'gravity', name: 'Altered Gravity', short: 'Gravity', icon: '⇅',
    blurb: 'Weightlessness unloads bones and muscles and shifts fluids toward the head, causing bone loss, heart deconditioning and changes to the eye (SANS).',
    risks: ['Bone loss (1–1.5% per month in the hip)', 'Cardiovascular deconditioning', 'Spaceflight-Associated Neuro-ocular Syndrome (SANS)'] },
  { id: 'environment', name: 'Hostile Closed Environment', short: 'Environment', icon: '⌂',
    blurb: 'A sealed spacecraft recycles its air and water. Raised CO₂, microbes and a weakened immune system make headaches and infections more likely.',
    risks: ['Elevated CO₂ (headache, reduced thinking)', 'Immune dysregulation & viral reactivation', 'Infection'] },
];

export interface Metric {
  key: MetricKey; name: string; unit: string; hazard: HazardId; organ: OrganId;
  decimals: number;
  /** absolute limits: amber/red below or above (clinical or NASA standard) */
  lowAmber?: number; lowRed?: number; highAmber?: number; highRed?: number;
  /** direction considered bad for personal-baseline drift: 'up', 'down' or 'both' */
  bad: 'up' | 'down' | 'both';
  /** minimal meaningful change from baseline (absolute units), avoids alerting on noise */
  minDelta: number;
  how: string; why: string; source: string;
  selfReported?: boolean;
}

export const METRICS: Record<MetricKey, Metric> = {
  hr: { key: 'hr', name: 'Resting heart rate', unit: 'bpm', hazard: 'gravity', organ: 'heart', decimals: 0,
    lowRed: 40, lowAmber: 48, highAmber: 90, highRed: 110, bad: 'both', minDelta: 6,
    how: 'Morning, before getting out of the sleep station. Rest 5 min, then read the chest-strap or wrist sensor (or count your pulse for 30 s × 2).',
    why: 'In weightlessness the heart has less work to do and loses fitness. A rising resting HR can signal deconditioning, dehydration, infection or stress.',
    source: 'NASA HRP: Risk of cardiovascular adaptations' },
  sbp: { key: 'sbp', name: 'Blood pressure (systolic)', unit: 'mmHg', hazard: 'gravity', organ: 'heart', decimals: 0,
    lowRed: 85, lowAmber: 95, highAmber: 135, highRed: 160, bad: 'both', minDelta: 10,
    how: 'Seated (feet in foot loops), arm at heart level, cuff on bare upper arm. Rest 5 min, take 2 readings 1 min apart and log the average.',
    why: 'Fluids shift to the head in microgravity. Low pressure after landing can cause fainting (orthostatic intolerance); high pressure raises cardiovascular risk.',
    source: 'NASA HRP: Cardiovascular adaptations; NASA-STD-3001 Vol 1' },
  dbp: { key: 'dbp', name: 'Blood pressure (diastolic)', unit: 'mmHg', hazard: 'gravity', organ: 'heart', decimals: 0,
    lowRed: 50, lowAmber: 58, highAmber: 88, highRed: 100, bad: 'both', minDelta: 8,
    how: 'Taken together with systolic pressure (the lower number).',
    why: 'Together with systolic pressure this tracks how the heart and blood vessels adapt to weightlessness.',
    source: 'NASA HRP: Cardiovascular adaptations' },
  hrv: { key: 'hrv', name: 'Heart rate variability', unit: 'ms', hazard: 'isolation', organ: 'heart', decimals: 0,
    lowRed: 15, lowAmber: 22, bad: 'down', minDelta: 10,
    how: 'Automatic: overnight chest-strap ECG (RMSSD). Nothing to do except wear the strap while sleeping.',
    why: 'HRV reflects recovery and stress. A falling HRV is an early warning of fatigue, overtraining, illness or psychological strain.',
    source: 'NASA HRP: Behavioral health & performance research' },
  spo2: { key: 'spo2', name: 'Blood oxygen (SpO₂)', unit: '%', hazard: 'environment', organ: 'lungs', decimals: 0,
    lowRed: 90, lowAmber: 94, bad: 'down', minDelta: 2,
    how: 'Clip the pulse oximeter on a warm finger, stay still for 30 s and read the steady value.',
    why: 'A sealed cabin depends on life support. Low SpO₂ can indicate a cabin-air problem, lung illness or decompression.',
    source: 'NASA-STD-3001 Vol 2 (atmosphere)' },
  temp: { key: 'temp', name: 'Body temperature', unit: '°C', hazard: 'environment', organ: 'immune', decimals: 1,
    lowRed: 35.0, lowAmber: 35.8, highAmber: 37.6, highRed: 38.3, bad: 'both', minDelta: 0.5,
    how: 'Morning, before exercise or eating. Ear (tympanic) thermometer, same ear each day.',
    why: 'In space, core temperature runs about 1 °C higher, especially during exercise. A sustained rise can mean infection, a known risk because immunity weakens in flight.',
    source: 'NASA HRP: Risk of adverse health event due to altered immune response' },
  glucose: { key: 'glucose', name: 'Blood sugar (fasting)', unit: 'mg/dL', hazard: 'distance', organ: 'metabolism', decimals: 0,
    lowRed: 54, lowAmber: 70, highAmber: 100, highRed: 126, bad: 'both', minDelta: 12,
    how: 'Before breakfast: clean finger, lancet prick, touch the strip to the drop. Retest if the reading surprises you.',
    why: 'Spaceflight can reduce insulin sensitivity, and with no resupply nutrition must be managed on board. Low readings can affect thinking during critical tasks.',
    source: 'NASA HRP: Risk of inadequate food & nutrition; NASA OSDR OSD-575' },
  sleep: { key: 'sleep', name: 'Sleep', unit: 'h', hazard: 'isolation', organ: 'brain', decimals: 1,
    lowRed: 5, lowAmber: 6.0, bad: 'down', minDelta: 0.8,
    how: 'Automatic from the wrist actigraphy band; confirm or correct in the daily check-in.',
    why: 'Astronauts average about 6 h of sleep. Short sleep slows reactions and raises the risk of errors, irritability and low mood.',
    source: 'NASA HRP: Risk of performance decrements due to sleep loss & circadian desynchronization' },
  mood: { key: 'mood', name: 'Mood', unit: '/10', hazard: 'isolation', organ: 'brain', decimals: 0,
    lowRed: 3, lowAmber: 5, bad: 'down', minDelta: 2, selfReported: true,
    how: 'Daily check-in slider: 1 = very low, 10 = excellent. Be honest; you choose what gets shared.',
    why: 'Isolation and confinement can slowly wear down mood. A gradual decline is easy to miss in yourself, so the trend matters more than any single day.',
    source: 'NASA HRP: Risk of adverse cognitive or behavioral conditions' },
  stress: { key: 'stress', name: 'Stress', unit: '/10', hazard: 'isolation', organ: 'brain', decimals: 0,
    highAmber: 7, highRed: 9, bad: 'up', minDelta: 2, selfReported: true,
    how: 'Daily check-in slider: 1 = calm, 10 = overwhelmed.',
    why: 'Chronic stress disturbs sleep and immunity and can strain crew relationships.',
    source: 'NASA HRP: Behavioral health & performance' },
  pvt: { key: 'pvt', name: 'Reaction time (PVT)', unit: 'ms', hazard: 'isolation', organ: 'brain', decimals: 0,
    highAmber: 340, highRed: 420, bad: 'up', minDelta: 30,
    how: 'Take the Reaction Test in the Tests tab: tap as soon as the counter appears. 3 minutes (30 s demo mode available).',
    why: 'The Psychomotor Vigilance Test is a standard fatigue measure used in spaceflight research. Slower reactions mean a higher risk of errors during operations.',
    source: 'NASA "Cognition" test battery / PVT (Basner et al.)' },
  exercise: { key: 'exercise', name: 'Exercise', unit: 'min', hazard: 'gravity', organ: 'muscles', decimals: 0,
    lowRed: 60, lowAmber: 100, bad: 'down', minDelta: 30,
    how: 'Logged automatically from the treadmill, cycle ergometer and resistance device; add anything else in the check-in.',
    why: 'About 2 h of daily exercise is the main countermeasure against bone and muscle loss in weightlessness.',
    source: 'NASA HRP: Risk of bone fracture / muscle loss; ISS exercise countermeasures' },
  mass: { key: 'mass', name: 'Body mass', unit: 'kg', hazard: 'distance', organ: 'metabolism', decimals: 1,
    bad: 'down', minDelta: 2.5,
    how: 'Weekly, on the body-mass measurement device (a spring-based device, since scales don\'t work without gravity).',
    why: 'Most astronauts lose weight in flight from eating too little. Lost mass often means lost muscle and bone.',
    source: 'NASA HRP: Risk of inadequate food & nutrition' },
  bone: { key: 'bone', name: 'Hip bone density (est.)', unit: '% vs pre-flight', hazard: 'gravity', organ: 'bones', decimals: 1,
    lowAmber: -5.5, lowRed: -8, bad: 'down', minDelta: 1.0,
    how: 'Estimated daily from exercise load, gravity level and urine calcium; confirmed monthly by on-board ultrasound/biomarkers where available.',
    why: 'Without load, hip and spine bones lose about 1–1.5% of their mass per month, which raises fracture risk on landing.',
    source: 'NASA HRP: Risk of bone fracture due to spaceflight-induced changes to bone' },
  vision: { key: 'vision', name: 'Vision check (Amsler)', unit: 'distorted zones', hazard: 'gravity', organ: 'eyes', decimals: 0,
    highAmber: 1, highRed: 3, bad: 'up', minDelta: 1,
    how: 'Weekly Amsler grid test in the Tests tab: cover one eye, stare at the centre dot and tap any area where lines look wavy, blurred or missing.',
    why: 'Fluid shifting to the head can change the shape of the eye and optic nerve (SANS). Early detection lets the crew adjust and lets flight surgeons plan imaging.',
    source: 'NASA HRP: Risk of Spaceflight-Associated Neuro-ocular Syndrome (SANS)' },
  symptoms: { key: 'symptoms', name: 'Immune symptoms', unit: 'count', hazard: 'environment', organ: 'immune', decimals: 0,
    highAmber: 1, highRed: 3, bad: 'up', minDelta: 1, selfReported: true,
    how: 'Daily check-in: tick any of cold sores, rash, sore throat, fever/chills, slow-healing cuts, unusual fatigue.',
    why: 'Spaceflight weakens immunity: dormant viruses (herpes, Epstein-Barr, chickenpox virus) reactivate in many astronauts, and skin rashes are common.',
    source: 'NASA HRP: Risk of adverse health event due to altered immune response' },
  co2: { key: 'co2', name: 'Cabin CO₂', unit: 'mmHg', hazard: 'environment', organ: 'lungs', decimals: 1,
    highAmber: 2.5, highRed: 4.0, bad: 'up', minDelta: 0.8,
    how: 'Automatic: life-support sensors. Wear the personal CO₂ monitor in poorly ventilated areas.',
    why: 'Air doesn\'t circulate by itself in weightlessness, so CO₂ can collect around your head and cause headaches and slower thinking.',
    source: 'NASA-STD-3001 Vol 2: CO₂ limit 2.5 mmHg (24-h average)' },
  dose: { key: 'dose', name: 'Radiation dose today', unit: 'mSv', hazard: 'radiation', organ: 'immune', decimals: 2,
    highAmber: 3, highRed: 10, bad: 'up', minDelta: 0.5,
    how: 'Automatic: personal dosimeter worn on the body plus the cabin radiation monitor.',
    why: 'Daily dose tracks against the NASA career limit of 600 mSv. Solar particle events can deliver a large dose within hours, so shelter right away.',
    source: 'NASA-STD-3001 Vol 1: career effective dose limit 600 mSv' },
};

export const ORGANS: Record<OrganId, { name: string; blurb: string; metrics: MetricKey[] }> = {
  brain: { name: 'Brain & mind', metrics: ['sleep', 'mood', 'stress', 'pvt'],
    blurb: 'Isolation, confinement, disturbed sleep and CO₂ affect alertness, mood and teamwork.' },
  eyes: { name: 'Eyes', metrics: ['vision'],
    blurb: 'Fluid moving toward the head can flatten the eyeball and swell the optic nerve (SANS), shifting vision.' },
  heart: { name: 'Heart & vessels', metrics: ['hr', 'sbp', 'dbp', 'hrv'],
    blurb: 'The heart loses fitness without gravity; blood volume falls; fainting after landing is common.' },
  lungs: { name: 'Lungs & cabin air', metrics: ['spo2', 'co2'],
    blurb: 'You breathe recycled air, so CO₂ and oxygen depend on life support working.' },
  bones: { name: 'Bones', metrics: ['bone'],
    blurb: 'Hip and spine lose about 1–1.5% per month in weightlessness, raising fracture and kidney-stone risk.' },
  muscles: { name: 'Muscles', metrics: ['exercise', 'mass'],
    blurb: 'Postural and leg muscles waste quickly without load; daily exercise protects them.' },
  immune: { name: 'Immune system', metrics: ['temp', 'symptoms', 'dose'],
    blurb: 'Stress, radiation and the closed environment weaken immunity, so dormant viruses can wake up.' },
  metabolism: { name: 'Nutrition & metabolism', metrics: ['glucose', 'mass'],
    blurb: 'No resupply far from Earth: energy intake, blood sugar and body mass need watching.' },
};

export type Level = 'self' | 'crew' | 'ground';
export interface Action { title: string; detail: string; level: Level }

/** Countermeasure playbook: what to do when a metric is off-nominal. */
export const PLAYBOOK: Record<MetricKey, Action[]> = {
  hr: [
    { title: 'Hydrate and re-measure', detail: 'Drink 500 mL of water, rest 10 min, take the reading again.', level: 'self' },
    { title: 'Check for infection or stress', detail: 'Take your temperature and complete the check-in.', level: 'self' },
    { title: 'Tell the Crew Medical Officer', detail: 'If resting HR stays > 15 bpm above your normal for 3 days.', level: 'crew' },
  ],
  sbp: [
    { title: 'Re-measure correctly', detail: 'Sit for 5 min, cuff at heart level, average 2 readings.', level: 'self' },
    { title: 'Reduce salt, keep exercising', detail: 'Follow the cardio prescription on the cycle ergometer.', level: 'self' },
    { title: 'Flight surgeon review', detail: 'Repeated readings above 160/100 or below 85 systolic with dizziness.', level: 'ground' },
  ],
  dbp: [
    { title: 'Re-measure correctly', detail: 'Average 2 seated readings, 1 min apart.', level: 'self' },
    { title: 'Share with Crew Medical Officer', detail: 'If diastolic stays above 90 mmHg.', level: 'crew' },
  ],
  hrv: [
    { title: 'Prioritise recovery', detail: 'Lighter exercise today and 10 min of slow breathing (4 s in, 6 s out).', level: 'self' },
    { title: 'Protect sleep', detail: 'Same sleep window, lights dimmed 1 h before.', level: 'self' },
  ],
  spo2: [
    { title: 'Re-measure on a warm finger', detail: 'Cold fingers give false low readings.', level: 'self' },
    { title: 'Check cabin atmosphere', detail: 'Read the life-support display; alert the crew if O₂ is low.', level: 'crew' },
    { title: 'Emergency if < 90%', detail: 'Oxygen mask, alert the commander, contact ground.', level: 'ground' },
  ],
  temp: [
    { title: 'Re-measure after 30 min of rest', detail: 'Exercise raises core temperature in space.', level: 'self' },
    { title: 'Isolate and hydrate if feverish', detail: 'Wear a mask in shared modules and drink fluids.', level: 'crew' },
    { title: 'Medical kit: antipyretic', detail: 'Per the on-board medical checklist; log the dose in PRANA.', level: 'crew' },
  ],
  glucose: [
    { title: 'Low (< 70): fast-acting sugar', detail: '15 g of carbohydrate (juice pouch), retest after 15 min.', level: 'self' },
    { title: 'High: retest fasting tomorrow', detail: 'Review meals; walk/cycle 20 min after meals.', level: 'self' },
    { title: 'Ground nutrition review', detail: 'If fasting stays > 126 mg/dL or repeated lows.', level: 'ground' },
  ],
  sleep: [
    { title: 'Fix the sleep window', detail: 'Same bed time ±30 min; eye mask and earplugs; no screens 1 h before.', level: 'self' },
    { title: 'Light therapy', detail: 'Use the bright-blue light panel in the morning, dim warm light in the evening.', level: 'self' },
    { title: 'Ask the commander to shift tasks', detail: 'If sleep stays under 6 h for 3+ nights, rebalance the schedule.', level: 'crew' },
  ],
  mood: [
    { title: 'Connect', detail: 'Schedule a call or video message with family; share a meal with the crew.', level: 'self' },
    { title: 'Self-care block', detail: 'Music, Earth observation, plant care, journaling: 30 min, protected time.', level: 'self' },
    { title: 'Private consult', detail: 'Book a confidential session with the ground psychologist (delay-tolerant messaging).', level: 'ground' },
  ],
  stress: [
    { title: 'Breathing exercise', detail: '5 minutes of box breathing (4-4-4-4).', level: 'self' },
    { title: 'Workload check-in', detail: 'Talk to the commander about task load.', level: 'crew' },
  ],
  pvt: [
    { title: 'Avoid critical tasks now', detail: 'No robotic arm, EVA prep or docking operations until rested.', level: 'self' },
    { title: 'Short nap', detail: 'A 20-minute nap; then retest.', level: 'self' },
    { title: 'Inform the commander', detail: 'Two slow tests in a row: reassign critical tasks.', level: 'crew' },
  ],
  exercise: [
    { title: 'Hit your 2-hour target', detail: 'Resistance device 60 min + treadmill/cycle 60 min.', level: 'self' },
    { title: 'Schedule protection', detail: 'Ask the commander to block your exercise slot.', level: 'crew' },
  ],
  mass: [
    { title: 'Eat to the meal plan', detail: 'Add 1 snack/day; log intake; aim for protein at every meal.', level: 'self' },
    { title: 'Nutrition review', detail: 'If you lose more than 5% of your body mass.', level: 'ground' },
  ],
  bone: [
    { title: 'Increase resistance load', detail: 'High-load squats & deadlifts on the resistance device, 6 days/week.', level: 'self' },
    { title: 'Vitamin D & calcium', detail: 'Take your supplements; drink enough to prevent kidney stones (> 2 L/day).', level: 'self' },
    { title: 'Flight surgeon review', detail: 'Estimated loss beyond 8%: consider medication (bisphosphonate protocol).', level: 'ground' },
  ],
  vision: [
    { title: 'Retest each eye', detail: 'Repeat the Amsler test tomorrow, same lighting.', level: 'self' },
    { title: 'Ultrasound / imaging', detail: 'Crew Medical Officer performs an eye ultrasound and fundoscopy if available.', level: 'crew' },
    { title: 'Ophthalmology consult', detail: 'Send results to ground. Consider the thigh-cuff countermeasure to reduce fluid shift.', level: 'ground' },
  ],
  symptoms: [
    { title: 'Hygiene & skin care', detail: 'Clean skin, moisturise, keep cuts covered.', level: 'self' },
    { title: 'Report to the Crew Medical Officer', detail: 'Cold sores, shingles-like rash or fever: they may start antivirals.', level: 'crew' },
  ],
  co2: [
    { title: 'Move to a ventilated area', detail: 'Stay near a fan; don\'t sleep in a stagnant corner.', level: 'self' },
    { title: 'Check the CO₂ scrubber', detail: 'Crew inspects the CO₂ removal system and runs the backup if needed.', level: 'crew' },
    { title: 'Life-support ground support', detail: 'Over 4 mmHg: notify ground engineering and limit heavy exercise.', level: 'ground' },
  ],
  dose: [
    { title: 'Storm shelter NOW (solar event)', detail: 'Move to the water-walled shelter; stay until the all-clear.', level: 'self' },
    { title: 'Minimise time in low-shielding modules', detail: 'Use the more shielded areas for sleep.', level: 'self' },
    { title: 'Dose review', detail: 'Ground radiation team re-plans EVAs if cumulative dose is high.', level: 'ground' },
  ],
};

export const LEVEL_LABEL: Record<Level, string> = {
  self: 'Do it yourself', crew: 'Involve crew / CMO', ground: 'Consult Earth',
};

export const CAREER_LIMIT_MSV = 600;
