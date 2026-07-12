# HELIX DESIGN SYSTEM v1.0
# Phase 2.5 — Experience Architecture

> **Purpose**
>
> This document defines the behavioral and experiential principles that govern every interaction inside Helix.
>
> Information Architecture defines navigation.
> Experience Architecture defines cognition.
>
> Every generated screen, interaction, animation, and workflow must preserve these principles.

**Status:** FROZEN — governs all screen generation from Login onward.
**Depends on:** Phase 1 (Product DNA), Phase 2 (Information Architecture).

---

## Experience Philosophy

Helix is not software. Helix is an **Intelligence Operating System**.

Users should never feel they are browsing data. They should feel they are **collaborating with an intelligent investigative system**.

---

## Design Goal

Every interaction reinforces one idea:

> **The system already understands the organization.**

The user should never wonder:

- Where is my data?
- What happened?
- What should I do?

Helix always answers those questions before they are asked.

---

## The Five UX Pillars

### 1. Awareness
Every screen begins with awareness. The first three seconds answer, in order:

```
Where am I?  →  What is happening?  →  Is everything healthy?
```

Example (Mission Control): Organization · Knowledge Ready · Runtime Healthy · 3 Active Investigations · 1 Requires Attention.

Never force users to search for context.

### 2. Intelligence
The system should feel **alive**, not animated.

Instead of `Loading...`, show system activity:

```
Retrieving Organization Knowledge
Ranking Similar Investigations
Searching SOP Library
Comparing Evidence
Reasoning
Generating Assessment
```

The user feels intelligence rather than waiting.

### 3. Confidence
Never hide uncertainty. Every answer must include Confidence, Evidence, Missing Evidence, Reasoning, Recommendations.

Confidence reads as `HIGH · 82% · Verified`, never a bare "AI Confidence".

### 4. Traceability
Every conclusion must be clickable:

```
Assessment → Citation → Chunk → Canonical Document → Original PDF → Organization
```

Nothing exists without provenance.

### 5. Action
Every page ends with **"What should I do next?"** — one dominant CTA, always. (e.g. Upload Calibration Certificate, Approve CAPA, Review Timeline, Invite QA Manager, Run Assessment.)

---

## Cognitive Flow

Every screen guides the eye in this order:

```
Context → Current Situation → Evidence → Reasoning → Decision → Action
```

Never: Charts → Metrics → Buttons → Cards → Random Widgets.

---

## Visual Hierarchy

- **Level 1 (largest):** Current Investigation, Current Assessment, Current Runtime
- **Level 2:** Evidence, Confidence, Timeline, Knowledge
- **Level 3:** Metadata, Tags, IDs, Version
- **Level 4 (collapsed):** Logs, Audit, Technical details

---

## Motion Principles

Motion exists only to explain — never to decorate.

- **Allowed:** Progress, Drawer, Timeline expansion, Runtime stages, Search results, Upload progress
- **Not allowed:** Floating icons, Background particles, Neon animations, Rotating cards, Excessive blur

### Runtime Animation
When an assessment starts, each stage turns green when complete:

```
Evidence Retrieved → Knowledge Search → Semantic Ranking → Reasoning → Confidence → Assessment Ready
```

The user watches intelligence happen.

---

## Information Density

- **Mission Control:** Medium density — overview
- **Workspace:** High density — operational
- **Landing:** Low density — storytelling
- **Settings:** Medium density — configuration

---

## Reading Pattern

All screens: `Top = Context → Center = Decision → Bottom = Action`. Never force zig-zag reading.

---

## Empty States

Never say `No Data`. Instead teach the next action:

```
Your organization has not uploaded knowledge.
Upload SOPs, manuals, policies and historical investigations.
Helix will transform them into Organization Memory.
```

---

## Loading States

Never a spinner. Always narrated system activity:

```
Building Timeline
Retrieving Knowledge
Ranking Evidence
Computing Confidence
Generating Assessment
```

---

## Error States

Never `Something went wrong`. State the cause and the recovery path:

```
Knowledge Retrieval Failed
Cause: Embedding Service Unavailable
Recommendation: Retry Retrieval — or — Use Cached Organization Memory
```

---

## Progressive Disclosure

Never overwhelm. Assessment starts as Summary · Confidence · Recommendation, and expands to:

```
Evidence → Reasoning → Timeline → Chunk → Document → PDF
```

---

## User Psychology

The user should feel: `Calm → In Control → Supported → Confident → Accountable`.
Never: `Confused → Overwhelmed → Distracted → Lost`.

---

## Trust Signals

Trust is built by showing Sources, Confidence, Missing Evidence, Version, Runtime, Audit Trail, Organization Memory Version, Knowledge Version — never through marketing language.

---

## Enterprise Feel

- **Should resemble:** Palantir Foundry, Linear, OpenAI Platform, Stripe Dashboard, Cursor, Arc Browser
- **Should NOT resemble:** ChatGPT, Notion AI, generic admin dashboard, CRM, analytics portal

---

## Color Psychology

- Background: very dark graphite (not black)
- Primary Accent: Signal Blue
- Success: muted green · Warning: amber · Critical: muted red · Confidence: blue scale

Never rainbow. Never gradients everywhere.

---

## Typography Psychology

- Headings: authority · Body: clarity · Numbers: precision
- Evidence: monospace · Runtime: monospace

---

## Screen Transitions

```
Landing → Login → Organization Setup → Mission Control → Investigation → Assessment → CAPA → Learning
```

The transition itself teaches the product.

---

## Helix Golden Experience

- After 5s: "This isn't another AI tool."
- After 15s: "It already understands how organizations work."
- After 30s: "It connects documents, evidence and investigations."
- After 60s: "My QA team could actually use this."
- After 2m: "This is an operating system."

---

## Experience Commandments

Every future screen generated must obey these rules:

1. Evidence before AI.
2. One primary action per screen.
3. Every conclusion must be traceable.
4. Every animation explains system state.
5. Never hide uncertainty.
6. Never hardcode business data.
7. Backend is the single source of truth.
8. Show organizational context before investigation context.
9. Make intelligence observable.
10. Leave the user more confident than when they arrived.
