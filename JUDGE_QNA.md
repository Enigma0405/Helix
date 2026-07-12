# Judge Q&A Cheat Sheet

Anticipated questions from the hackathon judges and concise, professional answers.

## Architecture & AI

**Q1: How does Helix prevent AI hallucinations?**
A: Helix does not use generative text for decision-making. We enforce strict JSON structured output from the LLM. The AI is relegated to the "Intelligence Layer" and its only job is to extract facts from the evidence and cross-reference them against the deterministic Organization Memory graph.

**Q2: What is "Organization Memory"?**
A: It is our canonical knowledge graph powered by PostgreSQL and `pgvector`. Instead of just dumping PDFs into a vector database, we map knowledge to physical assets (Equipment, Personnel, SOPs, Batches) so the AI always has facility-specific context.

**Q3: How are you utilizing AMD technology?**
A: We are using Fireworks AI to run `Gemma-4-31b-it`. Behind the scenes, Fireworks leverages AMD Instinct MI300X accelerators. This massive memory bandwidth is critical for Helix because we require instantaneous, high-throughput extraction over incredibly dense and technical manufacturing batch records.

**Q4: Why not just use OpenAI?**
A: In highly regulated environments like biopharma, data privacy, latency, and open-weight model control are paramount. Fireworks AI on AMD hardware gives us the speed of a proprietary model while allowing a path to on-premise deployment of open models (like Gemma or Llama) in the future.

**Q5: How does the AI generate the CAPA?**
A: We use a multi-step prompt chain. First, the retriever pulls historical CAPAs and the relevant SOP. Second, the Intelligence Layer compares the uploaded evidence against the SOP. Third, it generates a 3-step structured strategy (Containment, Systemic Prevention, Closure) based on historical success patterns.

## Business & Market

**Q6: Who is the target user?**
A: Quality Assurance (QA) Directors, Operations Leads, and Quality Control Analysts in biopharma, aerospace, and medical device manufacturing.

**Q7: How is this different from existing QMS systems like Veeva or MasterControl?**
A: Legacy QMS platforms are essentially digital filing cabinets. They require humans to do 100% of the investigative work. Helix is an EvidenceOps platform; it acts as an intelligent co-pilot that actively reasons over the data.

**Q8: What is your business model?**
A: B2B Enterprise SaaS. We charge a flat platform fee per manufacturing site, with an enterprise tier for multi-site intelligence federation.

**Q9: How do you handle regulatory compliance (FDA 21 CFR Part 11)?**
A: Helix is designed with "Humans in the Loop." The AI only drafts the assessment and CAPA. A credentialed human must verify the facts and electronically sign (approve) the closure, maintaining full regulatory compliance and audit trails.

**Q10: What is the barrier to entry for competitors?**
A: The complex mapping of the Organization Memory. General AI startups don't understand the physics of manufacturing (e.g., how an SOP relates to a specific sterile filter). We bridge the gap between physical engineering and AI.

## Technical Details

**Q11: What embedding model are you using?**
A: We use `nomic-embed-text-v1.5` via Fireworks for fast, highly semantic retrieval.

**Q12: How are you handling file uploads?**
A: Files are uploaded to our self-hosted MinIO instance (S3-compatible object storage), where they are chunked, embedded, and stored in `pgvector`.

**Q13: Is the frontend connected to the real backend?**
A: Yes. The dashboard, API routes, and database are fully functional. We use a seeded demo tenant (Aetheris BioPharma) to ensure consistent data for the presentation, but the architecture handles dynamic data natively.

**Q14: How does the system scale?**
A: The architecture is fully containerized (Docker). The FastAPI backend is stateless. PostgreSQL/pgvector and Redis can be scaled horizontally and vertically to handle thousands of concurrent queries across global sites.

**Q15: What's next for Helix?**
A: Version 2 will integrate directly with IoT and SCADA systems. Instead of waiting for an operator to upload evidence, Helix will detect anomalies in real-time, instantly pull the relevant SOP, and draft the RCA before the operator even reaches the machine.
