# Demo Script — 3 Minutes
## Project Helix EvidenceOps Platform | AMD Unicorn Hackathon

> **Format:** Conference / hackathon stage demo
> **Total Time:** 3 minutes (6 sections × ~30 seconds)
> **Setup:** System running at http://localhost, logged in as `demo@helix.ai`, Investigations page open

---

## PRE-DEMO CHECKLIST (5 minutes before)

- [ ] `docker compose ps` — all 6 services healthy
- [ ] Browser open to http://localhost, logged in as `demo@helix.ai`
- [ ] Investigation "Batch #2847 Contamination Event" visible in list
- [ ] Screen resolution: 1920×1080 minimum, browser full screen
- [ ] No notifications or alerts on screen
- [ ] Incognito mode to avoid browser noise

---

## SECTION 1: THE HOOK (0:00–0:30)

**[SLIDE/SCREEN: Investigations list page]**

> **SAY:**
> "Every month, manufacturing quality teams lose hundreds of hours investigating deviations. They're buried in PDFs, batch records, SOPs — searching manually for root causes. They miss correlations. They write CAPAs based on intuition, not evidence. And in regulated industries, that costs lives and millions in recalls."

> "Helix solves this. We built an EvidenceOps platform — upload your evidence, get AI-powered root cause hypotheses grounded in your own documents, approved by your team."

---

## SECTION 2: THE INVESTIGATION (0:30–1:00)

**[CLICK: Open "Batch #2847 Contamination Event" investigation]**

> **SAY:**
> "Here's a real scenario: Batch 2847 at Apex Precision Manufacturing. Environmental monitoring detected elevated particle counts. The quality team needs to understand why."

**[CLICK: Evidence tab]**

> **SAY:**
> "They've uploaded the environmental monitoring SOP, the batch record, and the temperature excursion report. Three documents, 47 pages total. Helix ingests them all — chunked, embedded into vectors, stored in pgvector."

---

## SECTION 3: THE AI ANALYSIS (1:00–1:30)

**[CLICK: "Analyze" button — wait for results]**

> **SAY:**
> "Watch this. One click. Helix retrieves the most relevant evidence chunks via vector similarity search — using AMD hardware — runs them through our hypothesis workflow, and generates ranked root cause hypotheses."

**[Hypotheses appear on screen]**

> **SAY:**
> "Three seconds. Three ranked hypotheses with confidence scores. Not a chatbot answer — each hypothesis is grounded in your specific documents."

---

## SECTION 4: THE EVIDENCE (1:30–2:00)

**[CLICK: Top hypothesis — "HVAC Filtration Failure"]**

> **SAY:**
> "Click in. See these citations? REF-1, REF-2, REF-3. Every claim the AI makes links to an exact passage in your SOP. Click REF-1—"

**[CLICK: Citation REF-1]**

> **SAY:**
> "—and here's the source text: 'HEPA filter replacement interval: 90 days. Last replacement: 127 days ago.' The AI found this. Your investigator would have needed hours."

> **SAY:**
> "And down here: grounding score 0.87. Citation precision 0.92. Hallucination rate 0.08. We track AI quality as a first-class metric."

---

## SECTION 5: HUMAN DECISION (2:00–2:30)

**[CLICK: CAPA tab]**

> **SAY:**
> "Helix generates a CAPA plan — corrective and preventive actions. But here's the critical design choice: the AI never approves its own CAPA."

**[SWITCH ACCOUNT: admin@helix.ai / CLICK: Approve CAPA]**

> **SAY:**
> "A manager reviews, decides, and approves. Human accountability. That approval triggers our knowledge capture workflow — this root cause pattern is now stored and will inform every future investigation at this organization. Closed-loop organizational learning."

---

## SECTION 6: AMD STORY + CLOSE (2:30–3:00)

**[SHOW: .env file or slide with the two lines]**

> **SAY:**
> "How does AMD fit in? This entire platform — every AI call — routes through one abstraction: the InferenceAdapter. In dev mode, it's mock responses. In production?"

**[SHOW or TYPE]**
```
INFERENCE_PROVIDER=fireworks
FIREWORKS_API_KEY=your_key
```

> **SAY:**
> "Two lines. No code changes. Fireworks AI routes to Gemma 4 running on AMD Instinct MI300X — 192 GB of HBM3 memory, 5.3 TB/s bandwidth. Open model. Open hardware. No vendor lock-in."

> **SAY:**
> "Project Helix: Evidence in. Decisions out. Powered by Gemma 4 on AMD Instinct MI300X via Fireworks AI."

**[SMILE. STOP.]**

---

## TIMING GUIDE

| Section | Clock | Key Action | Fallback if slow |
|---|---|---|---|
| Hook | 0:00–0:30 | Speak only | — |
| Investigation | 0:30–1:00 | Open investigation, show evidence | Skip evidence tab detail |
| AI Analysis | 1:00–1:30 | Click Analyze, wait for hypotheses | Pre-load hypotheses page |
| Evidence | 1:30–2:00 | Click hypothesis, show citation | Show citation from screenshot |
| Human Decision | 2:00–2:30 | Switch to admin, approve CAPA | Describe flow verbally |
| AMD Close | 2:30–3:00 | Show env var | Speak from memory |

---

## CRITICAL LINES TO MEMORIZE

1. **"Helix: Evidence in. Decisions out."**
2. **"Every AI claim links to an exact passage in your SOP."**
3. **"The AI never approves its own CAPA — human accountability, always."**
4. **"Two lines in a config file. AMD Instinct MI300X. No code changes."**

---

*Full 5-minute version: `docs/Demo_Script_5min.md` | Q&A recovery: `docs/Demo_QA_Recovery.md`*
