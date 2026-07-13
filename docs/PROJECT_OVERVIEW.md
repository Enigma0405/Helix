# Project Overview: Helix

## What is Helix?
Helix is an **EvidenceOps Platform** built for highly regulated manufacturing environments, such as Biopharma and Medical Devices. Unlike generic AI chatbots that hallucinate and lack traceability, Helix enforces a deterministic, evidence-first approach to quality assurance (QA) and root cause analysis.

## Why It Exists
In pharmaceutical manufacturing, a single deviation (e.g., a sterile filter failing an integrity test) can quarantine a $2M batch of medicine. QA engineers spend days manually tracing batch records, sensor logs, and SOPs (Standard Operating Procedures) to find the root cause. 

Helix solves this by constructing a digital twin of the factory's knowledge—the **Organization Memory**—and mapping real-time operational evidence against it to automatically draft compliance-ready assessments and CAPAs (Corrective and Preventive Actions).

## The EvidenceOps Philosophy
**Models observe. Systems decide. Humans remain accountable.**

Helix does not start with AI. It starts with structured evidence mapping. The AI is only invoked when the Evidence Graph is complete, ensuring that all reasoning is fully deterministic, traceable, and backed by factual data points.

## Runtime Flow
1. **Context Load:** The system retrieves the canonical definitions of the equipment and SOPs involved in an investigation.
2. **Evidence Collection:** QA engineers upload unstructured batch records, alerts, and logs.
3. **Cross Verification:** The Intelligence Layer (running on Fireworks AI / AMD MI300X) processes the evidence against the Canonical SOP constraints to identify gaps, conflicts, and facts.
4. **Assessment & CAPA:** The system generates a draft root-cause analysis and a 3-step CAPA (Containment, Systemic Prevention, and Verification).
5. **Human Approval:** QA personnel verify and approve the findings, rendering the final decision immutable.

## High-Level Architecture
- **Frontend:** React + Vite, delivering a modern Mission Control workspace.
- **Backend:** Python + FastAPI.
- **Data Layer:** PostgreSQL (Neon) storing the Organization Memory.
- **Inference:** Fireworks AI powering `Gemma-4-31b-it` over AMD MI300X accelerators.

## Demo Flow
When you boot the application, you will see a simulated deviation at Aetheris BioPharma involving a sterile filter (`EQ-FIL-008`) and a violated standard (`SOP-STER-014`). 
1. Navigate to **Investigations**.
2. Upload the provided evidence files.
3. Watch the **Intelligent Tracing** panel securely connect the uploaded evidence to the Organization Memory.
4. Trigger the AI Assessment to see deterministic reasoning in action.
5. Review the auto-generated CAPA.

## Repository Guide
Please see the `README.md` at the root of the repository for setup instructions and a visual guide. For deep architectural dives, refer to the [INDEX.md](./INDEX.md).
