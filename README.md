# PRANA: Physiological Readiness & Autonomy Network for Astronauts

**Team Yogic · Pune · NASA Space Apps Challenge 2026**
Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*

**Code:** https://github.com/Nischayanay/prana

On the way to Mars, a question to a flight surgeon can take 40 minutes to answer. **PRANA** is an
offline-first, on-board health companion. It gathers health indicators, compares them with **each
astronaut's own normal**, explains every finding in plain language and turns it into a concrete
action, so the crew can evaluate and act on their health without waiting for Earth.

## What it does

| Screen | What the astronaut gets |
|---|---|
| **Today** | Readiness score, alerts, 6 key vitals vs *your own* normal, today's countermeasure plan, the **5 NASA spaceflight hazards** |
| **Daily check** | Guided 6-step, ~5-minute check with how-to-measure instructions: BP, HR, SpO₂, temperature, blood sugar, sleep, mood, stress, symptoms, a playable **reaction-time test (PVT)** and an **Amsler vision grid** (SANS) |
| **Symptom guide** | Step-by-step treatment for 9 common spaceflight complaints: danger-sign check → self-care → medical kit → recheck, with escalation |
| **Body map** | Clickable human figure; each body system is coloured by status and explained |
| **Trends** | 18 indicators over the mission vs personal pre-flight band and safety limits |
| **Routine & rewards** | Daily routine, XP, streaks and badges that reward self-care, not "good numbers" |
| **Radiation & air** | Dose vs the NASA 600 mSv career limit, storm-shelter protocol, **live NASA DONKI** alerts, cabin CO₂ |
| **Earth link** | Delay-tolerant messaging with real light-time delay; the astronaut controls what is shared |
| **Real crew data** | **Real NASA OSDR** Inspiration4 blood data: personal baselines catch changes that lab ranges miss |
| **About & demo** | Guided scenarios; a Simulation panel to switch mission, astronaut and day |

UI built with [Untitled UI React](https://github.com/untitleduico/react) (MIT): Tailwind CSS v4 + React Aria.

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

**Open-source tools:** React, Vite, TypeScript, Tailwind CSS, Untitled UI React (MIT), React Aria, Recharts, Inter font.

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
