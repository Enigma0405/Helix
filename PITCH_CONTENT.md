# Helix: Pitch Deck Content

## Slide 1: Title
**Helix**
Evidence before AI. Always.
Transforming organizational knowledge into operational intelligence.

## Slide 2: Problem
**The Silent Crisis in Manufacturing**
- Regulated industries (biopharma, aerospace) have zero tolerance for error.
- When an anomaly occurs, QA teams spend 3+ weeks manually cross-referencing siloed data (batch records, SOPs, SCADA logs, calibration history).
- Delaying production costs up to $1M per day.

## Slide 3: Market
**The Enterprise Quality Market**
- Total Addressable Market: $18B+
- Current solutions: Static QMS software from the early 2000s.
- Competitors provide digital filing cabinets. We provide an intelligent reasoning engine.

## Slide 4: Current Pain
**Why not just use an AI Chatbot?**
- Chatbots hallucinate.
- They lack context of the specific facility's physics and rules.
- Regulators (FDA, EMA) require auditable proof, not probabilistic guesses.

## Slide 5: Solution
**Introducing EvidenceOps**
Helix introduces a deterministic operating layer for quality assurance.
1. **Organization Memory:** A canonical knowledge graph of the entire facility.
2. **Evidence Dropzone:** Operators upload logs directly to an active signal.
3. **Intelligence Layer:** AI reasons over the evidence against the Organization Memory to generate facts, not guesses.

## Slide 6: Product Demo
**Helix in Action**
*(Insert Screenshots of Helix Mission Control and Investigation Workspace)*
- See the real-time queue of deviations.
- Watch the AI instantly map equipment, personnel, and violated SOPs.
- Review the auto-generated 3-step Corrective and Preventive Action (CAPA).

## Slide 7: Architecture
**Deterministic & Fast**
- **Frontend:** React, Vite, Tailwind
- **Backend:** Python, FastAPI, PostgreSQL (pgvector)
- **Knowledge Layer:** Nomic Embeddings
- **Intelligence Layer:** Fireworks AI Inference

## Slide 8: AMD & Fireworks AI Integration
**Powered by AMD Instinct MI300X**
- Biopharma batch records are dense and massive.
- Helix leverages `Gemma-4-31b-it` running on AMD Instinct MI300X accelerators via Fireworks AI.
- Result: Sub-second, high-throughput structured JSON reasoning capable of digesting thousands of manufacturing parameters instantly.

## Slide 9: Competitive Advantage
**Evidence Before AI**
- We don't sell generative AI. We sell deterministic evidence tracing.
- Our Organization Memory architecture ensures every output is grounded in the tenant’s actual floor data.
- "Models observe. Systems decide. Humans remain accountable."

## Slide 10: Business Model
**Enterprise B2B SaaS**
- **Tier 1 (Facility):** Flat platform fee per site.
- **Tier 2 (Enterprise):** Multi-site graph federation, unlimited API ingestion.
- Target ACV: $120,000 / year.

## Slide 11: Future Roadmap
**Scaling EvidenceOps**
- **v1 (Current):** Deviation RCA and CAPA Generation.
- **v2 (Next 6 Mo):** Real-time SCADA IoT ingestion and predictive anomaly alerting.
- **v3 (1 Year):** Cross-site intelligence federation for global pharmaceutical networks.

## Slide 12: Closing
**Helix**
Operational Intelligence for the Industries that Matter Most.
Thank You.
