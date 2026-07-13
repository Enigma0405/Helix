# Helix Pitch Deck (Slide-by-Slide Content)

## Slide 1: Title
**Title:** Helix
**Subtitle:** Evidence before AI. Always.
**Visual:** Minimalist logo, dark enterprise aesthetic.

## Slide 2: The Problem
**Title:** Passive Systems in High-Stakes Industries
**Content:** 
- Regulated industries generate millions of operational events.
- Current Quality Systems are passive databases.
- QA teams spend weeks manually correlating evidence against thousands of rules.
**Speaker Notes:** "When a deviation happens on a manufacturing line, finding the root cause takes weeks of manual digging. The cost isn't just financial; it's operational paralysis."

## Slide 3: The AI Trust Gap
**Title:** Why Chatbots Fail the Enterprise
**Content:**
- Black-box reasoning.
- Hallucination risks.
- Zero regulatory traceability.
**Speaker Notes:** "You cannot put a chatbot in charge of FDA compliance. If an AI makes a decision, a human auditor needs to see the exact evidence used to make it."

## Slide 4: The Solution
**Title:** Introducing EvidenceOps
**Content:**
- Models Observe.
- Systems Decide.
- Humans Remain Accountable.
**Visual:** The EvidenceOps Pipeline Diagram (Observe -> Correlate -> Reason -> Approve).

## Slide 5: Organization Memory
**Title:** The Canonical Ground Truth
**Content:**
- Ingests SOPs, Batch Records, Equipment Specs.
- Creates a deterministic Knowledge Graph.
- AI is strictly bounded to this truth.
**Speaker Notes:** "We don't train models on your data. We build an Organization Memory that acts as a strict, queryable baseline."

## Slide 6: Live Operations
**Title:** Continuous AI Verification
**Visual:** Screenshot of the "Mission Control" live pipeline.
**Content:**
- Ingests events in real-time.
- Cross-verifies against Organization Memory instantly.
- Generates Operational Signals for anomalies.

## Slide 7: The Investigation Engine
**Title:** Deterministic Correlation
**Visual:** Screenshot of the "Investigation Detail" page with Traceability Modal.
**Content:**
- Automatically maps Equipment, Personnel, and Rules.
- Surfaces Evidence Gaps.
- Computes Confidence Scores.

## Slide 8: Action & Archival
**Title:** Closing the Loop
**Content:**
- AI drafts Evidence-Backed CAPAs.
- Human QA lead reviews and approves.
- Learnings are fed back into Organization Memory.

## Slide 9: Technology Architecture
**Title:** Enterprise-Grade Stack
**Visual:** System Architecture Diagram.
**Content:**
- React/Vite Frontend
- FastAPI & PostgreSQL/pgvector Backend
- Fireworks AI (AMD Instinct GPUs)

## Slide 10: The AMD Advantage
**Title:** Powered by AMD Instinct
**Content:**
- Real-time pipeline requires sub-second latency.
- Fireworks AI + AMD provides massive parallelization.
- Enables synchronous multi-step reasoning chains.
**Speaker Notes:** "To do this live, we needed extreme inference speed for structured JSON extraction. AMD Instinct GPUs via Fireworks made this possible."

## Slide 11: Market & Vision
**Title:** The Future of Regulated Industries
**Content:**
- Target: Biopharma, Aerospace, Advanced Manufacturing.
- Vision: From reactive QMS to proactive Enterprise Operating Systems.

## Slide 12: Conclusion
**Title:** Helix
**Subtitle:** Evidence before AI. Always.
**Content:** [Demo / Q&A]
