# Judge Q&A Prep (Unicorn Track)

Anticipated questions from judges and investors, with concise, enterprise-grade answers.

### 1. How is this different from just putting a RAG chatbot over our company documents?
**Answer:** Chatbots are unpredictable and lack accountability. Helix is a deterministic EvidenceOps pipeline. We don't ask the AI to "chat" about documents. We extract structured JSON facts, cross-verify them against a strict Organization Memory, and log every inference step in an immutable ledger. 

### 2. Why did you choose AMD Instinct GPUs via Fireworks AI?
**Answer:** To monitor live operational events across a massive manufacturing floor, we needed sub-second inference latency for complex structured JSON generation. The massive parallelization capabilities of AMD Instinct GPUs hosted on Fireworks allowed us to chain multiple RAG steps—retrieval, semantic matching, gap analysis—within a 2-second window.

### 3. How do you prevent hallucinations in a highly regulated industry?
**Answer:** We enforce strict boundary constraints. The LLM prompt explicitly forbids external knowledge generation. The AI is only allowed to evaluate the `Incoming Evidence` against the retrieved `Organization Memory` chunks. If there is no match, the AI flags an "Evidence Gap" rather than guessing. 

### 4. What happens if the AI generates a wrong CAPA?
**Answer:** Helix operates on the philosophy: *Models observe, systems decide, humans remain accountable.* Helix never automatically executes a CAPA. It drafts a recommendation based strictly on the deterministic trace. A human QA lead must always review the trace and approve the action.

### 5. Why build a custom UI instead of a Slack/Teams integration?
**Answer:** Quality investigations in biopharma are complex, multi-dimensional workflows. They require side-by-side document comparison, entity tracing, and formal approval workflows that are impossible to execute effectively within a chat interface. Helix is a full Enterprise Operating System, not a plugin.

### 6. How does the Organization Memory handle outdated SOPs?
**Answer:** The Organization Memory is synchronized with the company's canonical EDMS (Electronic Document Management System). When a document is versioned, `pgvector` updates the embeddings. The AI is explicitly instructed to only reference the active, approved version of a document.

### 7. What is the business model?
**Answer:** B2B Enterprise SaaS. We charge an annual platform fee based on the volume of operational events processed (events-per-second pipeline capacity) and the size of the Organization Memory (vector storage).

### 8. Who is your target customer?
**Answer:** Mid-to-large enterprises in highly regulated environments: Pharmaceutical Manufacturing, Medical Devices, Aerospace, and Advanced Manufacturing. These organizations spend millions annually on manual quality investigations.

### 9. Why PostgreSQL instead of a dedicated Vector DB like Pinecone?
**Answer:** Enterprise data sovereignty. `pgvector` allows us to keep highly sensitive vector embeddings in the exact same relational database as our RBAC (Role-Based Access Control) and investigation metadata. This eliminates data synchronization issues and simplifies on-premise deployments for strict compliance needs.

### 10. What is the next major feature on your roadmap?
**Answer:** Multi-Agent Workflows. While v1.0 handles the core EvidenceOps pipeline, v2.0 will introduce specialized agents, such as an "Audit Prep Agent" that automatically compiles the traceability graph into FDA-ready submission packets.
