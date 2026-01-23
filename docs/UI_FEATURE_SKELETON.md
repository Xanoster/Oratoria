# ORATORIA – FINAL UI & FEATURE SKELETON

Desktop-first, left-side navigation, production-ready

---

## GLOBAL APP LAYOUT (LOGGED-IN)

### Layout Structure

```
-------------------------------------------------
| Left Sidebar | Main Content Area              |
| (Fixed)      | (Scrollable)                  |
-------------------------------------------------
```

### Left Sidebar (ALWAYS VISIBLE)

Purpose: Orientation, fast access, zero cognitive load

Order matters. Do NOT change.

1. **Oratoria logo** (top)
   * Click → `/learn`

2. **Learn** (primary)
   * Icon: ▶
   * Route: `/learn`

3. **Review**
   * Icon: 🔁
   * Route: `/review`

4. **Speak**
   * Icon: 🎤
   * Route: `/speak`

5. **Roleplay**
   * Icon: 🧑🤝🧑
   * Route: `/roleplay`

6. **Progress**
   * Icon: 📈
   * Route: `/progress`

7. **Settings** (bottom pinned)
   * Icon: ⚙
   * Route: `/settings`

Rules:
* No badges.
* No counters except **Review** (only if >10 due).
* Active item highlighted subtly.
* Sidebar collapses to icons-only on small screens.

---

## PAGE-BY-PAGE DETAILED STRUCTURE

---

## 1. Landing Page (`/`)

**Purpose**: Filter serious users, explain method

### Sections (top → bottom)

1. **Hero**
   * Headline
   * Subhead
   * Primary CTA: `Start speaking German`
   * Secondary: `Log in`

2. **How Oratoria Works**
   * Step 1: Placement by speaking
   * Step 2: Daily guided speaking
   * Step 3: Correction + retention

3. **What We Explicitly Avoid**
   * No streaks
   * No guessing grammar
   * No fake progress

4. **Methodology**
   * Short factual explanation (learning science)
   * No testimonials

5. **Final CTA**
   * `Start speaking German`

---

## 2. Auth (`/auth`, `/auth/login`, `/auth/signup`)

**Purpose**: Access control only

### Layout
* Centered card
* No sidebar

### Features
* Email + password
* Magic link (passwordless)
* Redirect support

### Actions
* Success → `/learn`
* Failure → inline error only

---

## 3. Onboarding (`/onboarding`)

**Purpose**: Collect constraints, not preferences

### Step-by-step (one screen at a time)
1. Welcome
2. Goal
3. Time availability
4. Language background
5. Microphone explanation
6. Start placement

Rules:
* No skipping
* Auto-save progress

---

## 4. Placement Test (`/placement`)

**Purpose**: Determine CEFR A0–B2 via speech

### Main Area
* Prompt card (text + audio)
* Recording waveform
* Progress indicator (e.g., "2 of 4")

### Buttons
* `Record`
* `Repeat prompt`
* `Skip` (max once)

### AI Output
* Estimated level
* Confidence (High / Low)

### Flow
* Finish → `/learn`

---

## 5. Learn (Dashboard) (`/learn`)

**Purpose**: One clear next action

### Main Content
1. **Next Session Card** (dominant)
   * Title: `Your next 30-minute session`
   * Focus: e.g., "Speaking + Accusative"
   * Button: `Start session`

2. **Why this lesson?** (collapsed)
   * Explains personalization

### Secondary (de-emphasized)
* Text links only:
  * Review
  * Speak now

Rules:
* No grid of cards
* No progress stats here

---

## 6. Lesson View (`/learn/:lessonId`)

**Purpose**: Teach → force output → correct

### Main Flow (top → bottom)
1. **Context** - Short situation intro
2. **Input** - Dialogue or micro-story with Audio + transcript
3. **Pronunciation Drill** - 3–5 target words
4. **Grammar Focus** - Collapsed by default, expand on demand
5. **Main Speaking Task** - Record full answer
6. **Quick Recall Check** - 2 items

### Bottom Sticky Bar
* Primary: `Speak`
* Secondary: `Skip` (once only)

### After Speaking
* Auto-open **Pronunciation Feedback Modal**
* Then correction summary

---

## 7. Pronunciation Feedback (Modal)

**Purpose**: Fix intelligibility

### Modal Sections
1. Mispronounced words list
2. Phoneme breakdown
3. Native audio
4. Practice loop

### Buttons
* `Listen`, `Record`, `Compare`, `Practice again`, `Continue lesson`

Used from: Lesson, Speak, Review

---

## 8. Review (`/review`)

**Purpose**: Retention via SRS

### Flow
* One item at a time
* No scrolling

### Item Types
* Sentence recall
* Grammar pattern
* Pronunciation phrase

### Actions
* Speak or type answer
* Self-assess: `Again`, `Hard`, `Good`

Rules:
* Max 50 items/session
* Offline supported

---

## 9. Speak (`/speak`)

**Purpose**: Short, fast speaking reps

### Layout
1. Scenario dropdown
2. Prompt
3. Record control
4. Immediate micro-feedback

### Buttons
* `Record`, `Try again`, `Accept`

Accept → Deeper analysis, Optional pronunciation modal

---

## 10. Roleplay (`/roleplay`, `/roleplay/:id`)

**Purpose**: Real-world transfer

### Structure
* Chat-style
* Turn-based
* Voice-first

### Features
* Persona description
* Turn history
* Inline correction markers

### Special Controls
* `Pause & Coach`
* `Help` (one hint)

---

## 11. Progress (`/progress`)

**Purpose**: Honest diagnostics

### Sections
1. CEFR Level (A0–B2)
2. Speaking clarity trend
3. Grammar error trends
4. Vocabulary usage

### Suggested Actions
* `Do 10-min targeted practice`
* `Repeat pronunciation drill`

No: XP, Streaks, Scores without explanation

---

## 12. Settings (`/settings`)

**Purpose**: Control + trust

### Sections
* Profile
* Feedback depth
* Correction timing
* Time commitment
* Data & privacy

### Dangerous Action
* `Delete all voice data` - Requires typing confirmation

---

## CROSS-CUTTING FEATURES

| Feature               | Where                                      |
| --------------------- | ------------------------------------------ |
| ASR                   | Placement, Lesson, Speak, Review, Roleplay |
| Pronunciation scoring | Feedback modal                             |
| Grammar RAG           | Lesson, Roleplay, Review                   |
| SRS                   | Review, Lesson completion                  |
| Personalization       | Learn dashboard, lesson sequencing         |
| Offline cache         | Review, last lesson                        |
| Error recovery        | All speaking surfaces                      |

---

## PRIMARY USER FLOWS

### First-Time User (30 min)
```
Landing → Onboarding → Placement → Learn → Lesson → Speak → Pronunciation Feedback → End
```

### Daily 15-min
```
Learn → Review (10 min) → Speak (5 min)
```

### Speaking-Only
```
Speak → Accept → Feedback → Repeat
```

### Failure Recovery
```
Repeated error → Repair lesson auto-inserted → Explicit explanation → Short practice
```
