# Demo Script — 5 Minutes (Extended)
## Project Helix EvidenceOps Platform | AMD Unicorn Hackathon

> **Format:** Extended panel demo or investor/judge walkthrough
> **Total Time:** 5 minutes (7 sections)
> **Setup:** System running at http://localhost, fresh browser session

---

## PRE-DEMO CHECKLIST (10 minutes before)

- [ ] `docker compose ps` — all 6 services healthy
- [ ] `curl http://localhost/api/health` returns `{"status":"ok"}`
- [ ] Seed data verified: Batch #2847 investigation exists
- [ ] Browser: Chrome/Edge, 1920×1080, full screen, tab with http://localhost
- [ ] Second tab: http://localhost with admin@helix.ai logged in (for CAPA approval)
- [ ] `INFERENCE_PROVIDER` value known (mock or fireworks — adjust script accordingly)
- [ ] Evaluation metrics panel pre-loaded (if fireworks is slow, cache the screen)
- [ ] Have `.env` file open in a text editor (for AMD story)
- [ ] Phone/watch for timing

---

## SECTION 1: PROBLEM STATEMENT (0:00–0:45)

**[SCREEN: Investigation list page or intro slide]**

> **SAY:**
> "Let me paint you a picture. It's 2 AM. A quality engineer at a pharmaceutical manufacturer just got paged — a batch of 50,000 units failed environmental monitoring. She's got 72 hours before the FDA deviation report is due."
>
> "She opens a filing cabinet. She opens SharePoint. She starts reading 200 pages of SOPs, batch records, and environmental logs. Manually. Trying to find the correlation between a HEPA filter change interval and particle count spikes. She's not lazy — there's just no better way."
>
> "Regulated industries have this problem everywhere: pharma, medical devices, aerospace, food manufacturing. Investigation management is broken. Evidence sits in unstructured documents. Knowledge from past investigations dies in PDF archives. Every CAPA gets written from scratch."
>
> "Helix fixes this."

---

## SECTION 2: PLATFORM INTRODUCTION (0:45–1:15)

**[SCREEN: Investigation list with 3 seeded investigations visible]**

> **SAY:**
> "Project Helix is an EvidenceOps platform. The core loop is: Evidence → AI Analysis → Human Decision → Organizational Learning. And critically — AI never makes the final call. Every decision is human-approved."
>
> "We're looking at Apex Precision Manufacturing's quality investigation queue. Three open cases. Let's work the most critical one — Batch 2847, a contamination event."

**[CLICK: Open Batch #2847 investigation]**

> **SAY:**
> "Investigation opened. You can see the deviation type — environmental — severity: high. Created by our demo analyst, currently assigned for analysis."

---

## SECTION 3: EVIDENCE UPLOAD WORKFLOW (1:15–2:00)

**[CLICK: Evidence tab]**

> **SAY:**
> "Here's our evidence. Three documents uploaded by the analyst: the environmental monitoring SOP, the batch production record for lot 2847, and a temperature excursion report from the HVAC system."

**[CLICK: On one evidence file to show details]**

> **SAY:**
> "When a file is uploaded, Helix doesn't just store it. It runs a full ingestion pipeline: text extraction, chunking at 512 tokens with 64-token overlap, embedding via sentence-transformers — all-MiniLM-L6-v2, 384 dimensions — and vector storage in pgvector."

**[SHOW: Evidence file with processing_status: "processed"]**

> **SAY:**
> "Each document chunk is now a searchable vector. 47 pages became 312 indexed, retrievable knowledge fragments. That's the foundation of our RAG pipeline."

---

## SECTION 4: AI HYPOTHESIS GENERATION (2:00–2:45)

**[CLICK: Back to Overview → Click "Analyze" button]**

> **SAY:**
> "Now watch the workflow. One click triggers our hypothesis generation pipeline."

**[Hypotheses loading — narrate while waiting]**

> **SAY:**
> "What's happening right now: the retrieval engine runs a vector similarity search against all document chunks for this investigation. It pulls the top 10 most relevant passages. The prompt engine builds a structured prompt — including those passages as citations — and sends it to our inference backend."

**[Hypotheses appear]**

> **SAY:**
> "Three hypotheses, ranked by confidence. Top hypothesis: HVAC Filtration Failure — 87% confidence. Second: Personnel Gowning Protocol Deviation — 71%. Third: Cleanroom Pressure Differential Drop — 65%."

**[CLICK: Top hypothesis]**

> **SAY:**
> "Click in. Every hypothesis includes: title, full description, and — critically — grounded citations. REF-1, REF-2, REF-3 inline in the text."

---

## SECTION 5: CITATION GROUNDING (2:45–3:30)

**[CLICK: Citation REF-1]**

> **SAY:**
> "Click REF-1. Here's the source passage: 'HEPA filter replacement interval per SOP-ENV-007: every 90 days. Last replacement: 127 days prior to deviation event.' The AI didn't make this up. It cited an exact passage from your SOP."

**[CLICK: Citation REF-2]**

> **SAY:**
> "REF-2: 'Particle count readings from monitoring points 4 and 7 exceeded ISO Class 7 limits on days 15, 17, and 19 of the lot.' From the batch record. The AI cross-referenced the SOP and the batch record to form its hypothesis. That's EvidenceOps."

**[SHOW: Evaluation metrics panel — grounding_score, citation_precision, hallucination_rate]**

> **SAY:**
> "And we track AI quality as a first-class metric: grounding score 0.87, citation precision 0.92, hallucination rate 0.08. Below our 0.10 target. Every investigation has this panel. You can hold your AI accountable."

---

## SECTION 6: HUMAN DECISION + CLOSED-LOOP LEARNING (3:30–4:20)

**[CLICK: CAPA tab]**

> **SAY:**
> "Based on the top hypothesis, Helix generated a CAPA plan: corrective actions — quarantine affected area, emergency HEPA replacement, inspector re-audit; preventive actions — automated filter monitoring, SOP update to 60-day interval, real-time particle count alerts."

**[SWITCH TO ADMIN TAB]**

> **SAY:**
> "But here's the architectural decision I'm most proud of. This CAPA is in 'draft' status. It has zero operational effect. A quality manager must review and explicitly approve it."

**[CLICK: Approve CAPA button — add approval note]**

> **SAY:**
> "The manager reads the evidence, reads the CAPA, decides 'yes, this is correct' — and approves. That approval is written to our immutable audit log: actor ID, timestamp, before/after diff. 21 CFR Part 11 compatible."

**[SHOW: Audit trail row appearing]**

> **SAY:**
> "And approval triggers one more thing — our knowledge capture workflow. The root cause pattern from this investigation is extracted and stored in the organization's knowledge base. The next time any analyst at Apex Precision investigates an environmental deviation, this pattern is retrieved automatically. Organizational learning that compounds."

---

## SECTION 7: AMD STORY + COST ANALYSIS (4:20–5:00)

**[SHOW: .env file in text editor, or slide]**

> **SAY:**
> "Let me close with the AMD story."

**[SHOW: two lines in .env]**
```
INFERENCE_PROVIDER=fireworks
FIREWORKS_API_KEY=fw_api_key_here
FIREWORKS_MODEL=accounts/fireworks/models/gemma4-31b-it
```

> **SAY:**
> "This entire platform's AI stack routes through one abstraction — the InferenceAdapter protocol. In development: mock responses, zero cost, zero network. In production: these three lines in a config file. No code changes. Not one line."
>
> "Fireworks AI routes to Gemma 4 31B — open weights from Google, running on AMD Instinct MI300X hardware. 192 GB of HBM3 memory per GPU. 5.3 terabytes per second of memory bandwidth. The MI300X is built for exactly this: large-context inference at scale."
>
> "Cost comparison: GPT-4o for a typical hypothesis generation call — roughly $0.08. Gemma 4 31B on Fireworks via AMD — roughly $0.003. That's a 96% cost reduction, on open infrastructure, with no vendor lock-in."
>
> "We built Helix to be hardware-agnostic. Today it runs on AMD. Tomorrow it can run on any compute — on-premises, private cloud, any provider. Because the abstraction is correct."

**[FINAL LINE — make eye contact]**

> **SAY:**
> "Project Helix. Evidence in. Decisions out. Powered by Gemma 4 on AMD Instinct MI300X, via Fireworks AI. Thank you."

---

## TIMING GUIDE

| Section | Time | Duration | Fallback |
|---|---|---|---|
| Problem Statement | 0:00 | 45s | Shorten to 30s |
| Platform Intro | 0:45 | 30s | Skip investigation details |
| Evidence Workflow | 1:15 | 45s | Don't click individual files |
| AI Hypothesis | 2:00 | 45s | Pre-load hypotheses page |
| Citation Grounding | 2:45 | 45s | Show one citation only |
| Human Decision | 3:30 | 50s | Skip audit trail detail |
| AMD Story | 4:20 | 40s | Cut cost analysis |

---

## NUMBERS TO KNOW

| Fact | Value |
|---|---|
| Evidence documents in demo | 3 files, 47 pages |
| Document chunks indexed | ~312 |
| Embedding dimensions | 384 (local) / 768 (Fireworks) |
| Hypothesis latency (mock) | < 1 second |
| Hypothesis latency (Fireworks AMD) | ~3–5 seconds |
| Grounding score target | ≥ 0.80 |
| Citation precision target | ≥ 0.90 |
| Hallucination rate target | ≤ 0.10 |
| Cost: GPT-4o per investigation | ~$0.08 |
| Cost: Gemma 4/AMD/Fireworks | ~$0.003 (96% reduction) |
| AMD MI300X HBM3 memory | 192 GB |
| AMD MI300X memory bandwidth | 5.3 TB/s |
| Functional tests passing | 12/12 |

---

*3-minute version: `docs/Demo_Script_3min.md` | Q&A recovery: `docs/Demo_QA_Recovery.md`*
