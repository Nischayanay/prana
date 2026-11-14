# PRANA: Physiological Readiness & Autonomy Network for Astronauts

**Team Yogic · Pune · NASA Space Apps Challenge 2026**
Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

**Live app:** https://nischayanay.github.io/prana/

On the way to Mars, a question to a flight surgeon can take 40 minutes to answer. **PRANA** is an
offline-first, on-board health companion. It gathers health indicators, compares them with **each
astronaut's own normal**, explains every finding in plain language and turns it into a concrete
action, so the crew can evaluate and act on their health without waiting for Earth.

## What it does

| Screen | What the astronaut gets |
|---|---|
| **Today** | One Readiness score, the **5 NASA spaceflight hazards** (Radiation, Isolation, Distance, Gravity, Hostile environment) colour-coded, today's priorities and a countermeasure checklist |
| **Body map** | Clickable human figure: brain, eyes, heart, lungs, bones, muscles, immune system, metabolism, each with status, what spaceflight does to it, and what to do |
| **Trends** | 18 indicators over the mission vs. the astronaut's personal pre-flight band and safety limits |
| **Check-in** | 60-second daily log (BP, HR, temperature, blood sugar, SpO₂, sleep, mood, stress, symptoms) with how-to-measure guides; the assessment updates instantly |
| **Self-tests** | Real, playable **Psychomotor Vigilance Test** (fatigue) and **Amsler grid** vision test (SANS screening) |
| **Routine & XP** | Daily/weekly health routine, XP, streaks and badges that reward self-care rather than "good numbers" |
| **Radiation** | Cumulative dose vs. the NASA 600 mSv career limit, solar-storm shelter protocol, **live NASA DONKI** space-weather alerts (offline cache fallback) |
| **Earth link** | Delay-tolerant messaging to the flight surgeon with real light-time delay (Moon 1.3 s, Mars 3–22 min); the astronaut chooses which data categories are shared |
| **Real crew data** | **Real NASA OSDR data** from the Inspiration4 crew: shows that personal baselines catch post-flight changes that lab population ranges miss |
| **About & demo** | One-click guided scenarios (CO₂ fault, solar storm, viral reactivation, deconditioning, isolation, SANS) |

Mission environments: Space Station, Lunar Base, Mars Transit, Mars Base. Each changes gravity, radiation
dose rate and communication delay.

## How it works: Sense → Understand → Act

1. **Sense:** sensor streams (HR, HRV, BP, SpO₂, temperature, sleep, exercise, dose, cabin CO₂), the daily check-in and in-app tests.
2. **Understand:** an explainable engine with three layers (`src/lib/engine.ts`):
   - **Safety limits** (NASA-STD-3001 / clinical thresholds)
   - **Personal baseline:** pre-flight mean ± SD; flags drift ≥ 2 SD *and* above a meaningful minimum change
   - **Trend:** 14-day linear slope for early warning before any limit is crossed

   Indicators roll up into the 5 hazards and a Readiness score. Every flag includes the reasons in plain language.
3. **Act:** a countermeasure playbook per indicator (`src/lib/knowledge.ts`) with three escalation levels:
   *do it yourself → involve crew / Crew Medical Officer → consult Earth*.

Runs entirely in the browser: no server, works offline, data stays on the device.

## Data & resources

**NASA**
- NASA HRP: 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA HRP: Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- NASA HRP: Ongoing HRP Research in Space: https://www.nasa.gov/hrp/ongoing-hrp-research/
- NASA OSDR OSD-575: SpaceX Inspiration4 blood serum metabolic panel (real values, unmodified): https://osdr.nasa.gov/bio/repo/data/studies/OSD-575
- NASA DONKI space-weather notifications via https://api.nasa.gov/ (live; `public/donki-cache.json` is an offline snapshot)
- NASA-STD-3001 Space Flight Human-System Standard, Vol. 1 & 2 (career dose limit, CO₂ limit)

**Space agency partners**
- CSA: Monitoring Radiation for Astronaut Health: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- CSA: Why Do We Conduct Science Experiments in Space?: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp

**Literature for dose rates:** Zeitlin et al. 2013 (MSL-RAD cruise 1.84 mSv/day), Hassler et al. 2014 (Mars surface ~0.64 mSv/day), Zhang et al. 2020 (Chang'e-4 lunar surface 1.37 mSv/day).

**Simulated data:** the 180-day crew streams are **synthetic** (`src/lib/generate.ts`), generated from
published spaceflight rates, and labelled "SIMULATED" in the app. Crew members are fictional.

**Open-source tools:** React, Vite, TypeScript, Recharts.

## Use of AI (Super Intelligence)

Code, text and the data-extraction script were written with an AI assistant (Anthropic Claude)
and reviewed, tested and directed by Team Yogic. AI-assisted source files say so in their header
comments. No AI-generated images, audio or video are used. No NASA logos, insignia or mission
identifiers are used.

## Disclaimer

PRANA is a hackathon prototype for decision support, **not a medical device**. Thresholds are
illustrative and would require validation by flight surgeons.

## Run locally

```bash
npm install
npm run dev
```

Regenerate the Inspiration4 module from the NASA CSV:
`python3 scripts/extract_i4.py OSD-575_CMP.csv src/data/inspiration4.ts`
