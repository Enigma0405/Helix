# HELIX DESIGN SYSTEM v1.0
# Phase 2.6 — Spatial Architecture

> **Purpose**
>
> Information Architecture defines **where users go**.
> Experience Architecture defines **how users feel**.
> Spatial Architecture defines **how users perceive and process information**.
>
> Every layout, whitespace decision, panel size, animation, sidebar, and viewport must follow these rules.

**Status:** FROZEN — governs all screen layout from Login onward.
**Depends on:** Phase 2 (IA), Phase 2.5 (Experience Architecture).

---

## Design Philosophy

Helix is not a website. Helix is not a dashboard. Helix is an **Enterprise Intelligence Operating System**.

The interface should disappear. The investigation should become the focus.

---

## The Golden Rule

Every screen answers these questions in exactly this order:

```
Where am I? → What is happening? → Why is it happening? → What should I do? → What happens next?
```

The eye should never search for these answers.

---

## Visual Gravity

Every screen has exactly ONE center of gravity:

- Landing → Runtime Visualization
- Mission Control → Operational Status
- Investigation → Assessment
- Knowledge Explorer → Knowledge Search
- Settings → Configuration

Everything else supports that gravity.

---

## Reading Pattern

Helix uses a controlled F-pattern:

```
Context
────────────────────────────
Primary Decision Area
────────────────────────────
Supporting Intelligence
────────────────────────────
Actions
```

Never scatter attention.

---

## Screen Grid (Desktop)

```
┌────────────────────────────────────────────┐
│ Global Context Bar                         │
├──────┬─────────────────────────────────────┤
│      │                                     │
│ Nav  │ Main Workspace                      │
│      │                                     │
│      │                                     │
├──────┴─────────────────────────────────────┤
│ Context Footer / Status                    │
└────────────────────────────────────────────┘
```

### Sidebar
- Width: **280px**, never collapses automatically.
- Contains only: Mission Control, Knowledge, Evidence, Investigations, Runtime, CAPA, Organization, Settings.
- Never cluttered.

### Top Context Bar
- Persistent, always visible.
- Contains: Organization, Knowledge Version, Runtime Status, Global Search, Notifications, User. Nothing else.

### Workspace
- Max width **1600px**, centered, never stretched edge-to-edge. Large breathing room.

---

## Vertical Rhythm

- Every section: **24px**
- Every group: **32px**
- Every screen: **64px** top margin

Whitespace communicates hierarchy.

---

## Information Weight

- **Level 1 (largest):** Investigation, Assessment, Runtime
- **Level 2 (medium):** Evidence, Timeline, Confidence
- **Level 3 (smaller):** Metadata, Tags, IDs, Versions
- **Level 4 (collapsed):** Audit, Technical

---

## Component Proportions

Cards are never equal — one dominant, others supporting.

Mission Control:

```
┌──────────────┬────────────────────────────┬──────────────┐
│ Organization │ Investigations             │ Runtime      │
│ Knowledge    │ Intelligence               │ Health       │
│              │                            │ Actions      │
└──────────────┴────────────────────────────┴──────────────┘
```

Center is always visually dominant.

---

## Per-Screen Layouts

### Landing
```
Hero → Runtime Visualization → EvidenceOps Story → Platform Pillars →
Enterprise Workflow → Architecture → Security → CTA → Footer
```
Every section increases trust.

### Login
```
Brand → Headline → Authentication → Security Notes
```
No distractions.

### Setup Wizard
```
Progress Rail → Current Step → Form → Illustration → Continue
```
Feels like onboarding an enterprise.

### Mission Control (three-column)
- **Left:** Organization, Knowledge, Status
- **Center:** Investigations, Timeline, Recent Activity, Runtime
- **Right:** AI Intelligence, Alerts, Actions, System Health

The eye always lands in the center.

### Investigation Workspace (continuous, not cards)
```
Evidence → Timeline → Assessment → Reasoning → CAPA → Runtime
```

### Evidence Drawer
Slides from right, never modal, maintains context. Contains Source PDF, Chunk, Similarity, Page, Citation, Traceability.

### Knowledge Explorer (split)
- **Left:** Documents · **Center:** Knowledge · **Right:** Relationships
- Search never disappears.

### Runtime (vertical pipeline)
```
Evidence → Knowledge Retrieval → Semantic Search → Ranking → Reasoning → Confidence → Assessment
```
Each stage becomes complete.

### CAPA
Large, calm, minimal, decision-focused — not form-focused.

---

## White Space Rules

Dense information, not crowded. Every important component is surrounded by empty space. Space creates confidence.

---

## Motion

Only three motion types: **Reveal, Progress, Transition**. No decorative animation.

---

## Depth & Surfaces

- **Elevation levels (three only):** Background, Workspace, Overlay. Nothing higher.
- **Shadows:** almost invisible, very soft (Linear-like).
- **Borders:** 1px, low contrast, everything aligned.
- **Radius:** 12px cards · 10px inputs · 999px badges. Consistent.

---

## Color Distribution

- 85% Dark Surface
- 10% Neutral
- 5% Signal Blue

Blue attracts action, never decoration.

---

## Typography Rhythm

One H1, few H2, several H3, body, caption, monospace. Nothing else.

---

## Search

Always accessible, global, in the top bar. Never hidden.

---

## Navigation Rules

User never loses orientation. Every page shows Current Organization, Current Module, Current Investigation, Breadcrumb.

---

## Responsive Strategy

- **Desktop first.**
- **Tablet:** preserve workflow.
- **Mobile:** read-only. No enterprise investigation should require mobile editing.

---

## Eye Tracking

- **Landing:** Headline → Runtime → Story → CTA
- **Mission Control:** Organization → Investigation → Runtime → Actions
- **Investigation:** Evidence → Assessment → Recommendation → CAPA
- **Knowledge:** Search → Document → Entities → Relationships

---

## Spatial Psychology

The user should feel Protected, Supported, Organized, In control. Never overwhelmed.

---

## Anti-Patterns (never use)

- Equal-sized cards everywhere
- Dashboard KPI walls
- Random widget grids
- Floating buttons
- Huge empty hero with tiny content
- Endless scrolling dashboards
- Chat window as primary interface
- Bright gradients
- Oversized icons
- Decorative animations

---

## Spatial Signature of Helix

Every page should visually communicate this flow:

```
Organization Context → Knowledge → Evidence → Reasoning → Assessment → Decision → CAPA → Learning
```

The layout itself should teach the product.

---

## The Helix Rule

If someone hides all text and leaves only the layout visible, an enterprise user should still understand that there is an organization, there is knowledge, there is live evidence, there is intelligence, there is an assessment, and there is a decision waiting to be made.

That is the hallmark of a truly coherent enterprise operating system.

---

## What Comes Next

With Phase 1 (Product DNA), Phase 2 (IA), Phase 2.5 (Experience Architecture), and Phase 2.6 (Spatial Architecture) complete, the design foundation is professional-grade. Recommended remaining sequence:

1. **Phase 3 — Design System** (colors, typography, spacing, tokens, icons, components)
2. **Phase 4 — Screen Specifications** (every screen defined before generation)
3. **Phase 5 — v0 Prompt Pack** (one prompt per screen)
4. **Phase 6 — High-fidelity visual references** (mockups before implementation)
