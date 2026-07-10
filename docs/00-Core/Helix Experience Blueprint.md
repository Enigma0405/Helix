# PROJECT HELIX: EXPERIENCE BLUEPRINT
**Phase 0: Designing EvidenceOps**

**Document ID:** HELIX-DOC-001

> [!IMPORTANT]
> This document is the North Star for Project Helix. It dictates the product philosophy, the experience, the AI interaction model, and the enterprise workflows. It defines our category: **EvidenceOps**.

---

## Chapter 1: Product Philosophy

### Mission
To transform quality investigations from retrospective, manual data entry into proactive, AI-driven EvidenceOps, elevating humans from data gatherers to accountable adjudicators.

### Vision
To be the category-defining platform for enterprise investigations over the next decade—a system where the investigation progresses by itself, powered by a specialized AI workforce that observes, reasons, and connects evidence continuously.

### EvidenceOps Definition
EvidenceOps is a fundamentally new software category. It is the continuous, automated cycle of evidence ingestion, contextualization, semantic reasoning, and risk mitigation. In EvidenceOps, the system proactively builds the case, forms hypotheses, and drafts the CAPA, requiring human intervention strictly for review, course correction, and final accountability.

### Why Existing CAPA Software Fails
Legacy systems (like TrackWise or Veeva) are merely relational databases with workflow wrappers. They wait for humans. A human must find the anomaly, gather the logs, interview the staff, write the summary, formulate the CAPA, and route it for approval. They are static, slow, inherently biased, and treat investigations as a documentation burden rather than a truth-seeking mission.

### Why Helix Exists
Helix exists because investigations shouldn't start when a human opens a form. Helix exists so that the AI feels like another highly capable member of the investigation team—one that works at machine speed to gather all facts, cross-reference decades of historical data, and present a high-confidence narrative. Helix exists to eliminate the "Generate" button, replacing it with an autonomous, continuous reasoning engine.

### Principles
1. **AI Acts, Humans Decide**: The AI does the heavy lifting of gathering and reasoning; humans apply judgment and accountability.
2. **Evidence is a Living Graph**: Data is not siloed. Every piece of evidence connects to equipment, personnel, past deviations, and SOPs.
3. **Confidence is Quantifiable**: The AI must explain *why* it believes a hypothesis and what missing evidence would increase its confidence.

---

## Chapter 2: Enterprise Personas

### 1. Quality Analyst
*   **Responsibilities**: Conducting daily investigations, reviewing AI findings, requesting additional evidence.
*   **Pain Points**: Wasting 80% of time gathering logs and formatting reports instead of solving the root cause.
*   **Goals**: Close investigations rapidly with high accuracy and zero compliance risk.
*   **Decisions**: "Is this AI-generated hypothesis valid?", "Do we have enough evidence to proceed?"
*   **Daily Workflow**: Reviewing the Helix Inbox. The AI has already drafted the investigation; the analyst reviews the Evidence Graph, accepts/rejects hypotheses, and approves the draft for the QA Manager.
*   **AI Assistance**: The AI builds the timeline, fetches relevant SOPs, and highlights discrepancies in witness statements automatically.

### 2. QA Manager
*   **Responsibilities**: Overseeing the analyst team, ensuring CAPAs are effective, managing department metrics.
*   **Pain Points**: Inconsistent investigation quality; bottlenecked approval queues.
*   **Goals**: Maintain a state of continuous compliance; reduce average closure time.
*   **Decisions**: "Does this CAPA actually address the root cause?", "Should I escalate this to the Executive team?"
*   **Daily Workflow**: Reviewing completed investigations. Helix highlights exactly *what* changed during the Analyst's review and the AI's confidence score of the final CAPA.
*   **AI Assistance**: AI Risk Agent automatically flags investigations with a high probability of recurrence based on historical trends.

### 3. Manufacturing Engineer
*   **Responsibilities**: Providing technical context on equipment and processes.
*   **Pain Points**: Being constantly interrupted to pull machine logs or explain technical anomalies to QA.
*   **Goals**: Minimize equipment downtime; prevent recurring mechanical failures.
*   **Decisions**: "Are the operating parameters within tolerance?", "Does the machine need a recalibration CAPA?"
*   **Daily Workflow**: Pinged by Helix AI requesting specific technical context or confirmation on an equipment anomaly.
*   **AI Assistance**: Helix automatically pulls the SCADA/IoT data for the engineer to review, pre-highlighting the anomalous timeframe.

### 4. Compliance Officer
*   **Responsibilities**: Ensuring all investigations meet regulatory requirements (FDA, ISO, etc.).
*   **Pain Points**: Finding out about compliance gaps during external audits rather than in real-time.
*   **Goals**: Zero audit observations (483s).
*   **Decisions**: "Does this record meet 21 CFR Part 11 requirements?", "Is the root cause analysis scientifically sound?"
*   **Daily Workflow**: Reviewing the Compliance Agent's dashboard, which continuously audits open investigations against regulatory frameworks.
*   **AI Assistance**: The Compliance Agent automatically checks every draft CAPA against FDA warning letters to ensure similar past mistakes are avoided.

### 5. Executive Approver
*   **Responsibilities**: Signing off on high-risk, high-cost CAPAs; overall risk posture.
*   **Pain Points**: Too much noise; inability to quickly grasp the financial or systemic risk of an issue.
*   **Goals**: Protect the brand, ensure product safety, allocate resources effectively.
*   **Decisions**: "Do I approve this $500k equipment overhaul CAPA?"
*   **Daily Workflow**: 2-minute mobile review of the Executive Briefing Agent's summary.
*   **AI Assistance**: Translates a 50-page technical investigation into a 3-bullet financial and risk-based executive summary.

### 6. Auditor (External/Internal)
*   **Responsibilities**: Verifying the integrity and compliance of the quality system.
*   **Pain Points**: Navigating clunky legacy systems to trace the history of a single deviation.
*   **Goals**: Ensure public safety and regulatory adherence.
*   **Decisions**: "Is this organization in control of its processes?"
*   **Daily Workflow**: Accessing a read-only, perfectly chained audit trail.
*   **AI Assistance**: Helix provides an "Auditor View" that perfectly threads the narrative from initial deviation to CAPA effectiveness check, with all cryptographic signatures verified.

### 7. Administrator
*   **Responsibilities**: Managing roles, AI permissions, and system integrations.
*   **Pain Points**: Maintaining complex routing rules and updating hardcoded workflows.
*   **Goals**: Seamless system uptime and secure access control.
*   **Decisions**: "Who has access to the AI's reasoning parameters?"
*   **Daily Workflow**: Monitoring system health and AI token usage.
*   **AI Assistance**: AI automatically suggests access control changes based on organizational shifts.

---

## Chapter 3: Golden Investigation Journey

**1. Incident occurs**
A temperature excursion happens on Bioreactor B.

**2. Investigation automatically created**
Helix intercepts the SCADA alarm. It doesn't wait for a human. It instantly opens Investigation INV-2026-089.

**3. Evidence automatically collected**
The Evidence Agent pulls the temperature logs, the batch record, and the active operator's training file.

**4. Metadata extracted**
Helix structures the unstructured data: Equipment=Bio-B, Product=Vaccine-X, Time=04:00z.

**5. Historical investigations linked**
The Knowledge Agent searches the last 10 years and links three similar excursions on this exact bioreactor.

**6. Equipment mapped**
The system identifies the specific chilling valve associated with the alarm.

**7. SOP retrieved**
The AI pulls SOP-402 (Bioreactor Temp Control) and highlights the expected vs. actual parameters.

**8. Timeline created**
A chronological visual timeline is auto-generated showing the alarm, the operator's login, and the valve actuation.

**9. Evidence graph generated**
A visual node graph connects the operator, the machine, the SOP, and the historical records.

**10. Missing evidence detected**
The AI realizes it doesn't have the calibration certificate for the chilling valve. It flags this to the human: *"Missing Evidence: Valve Cal-Cert."*

**11. AI confidence updates continuously**
As the human uploads the calibration certificate, the AI's confidence in its root cause shifts in real-time from 60% to 92%.

**12. Hypotheses generated**
AI proposes three root causes. The primary hypothesis (92% confidence): "Mechanical wear on Valve-C causing delayed closure."

**13. Counter hypotheses generated**
AI also proposes a counter-hypothesis: "Operator error during manual override" (12% confidence, disproven by system logs).

**14. Risk assessment**
The Risk Agent scores the systemic risk as HIGH, given the product type.

**15. CAPA draft**
Helix drafts a CAPA: Replace Valve-C and update the preventative maintenance schedule to 6 months instead of 12.

**16. QA Review**
The Quality Analyst logs in. They see a fully baked investigation. They review the logic, agree with the hypothesis, and hit "Approve."

**17. Executive Approval**
The Plant Manager gets a 3-sentence brief on their phone and approves the CAPA budget.

**18. Effectiveness Verification**
6 months later, Helix automatically checks the valve performance data to verify the CAPA worked.

**19. Knowledge retained**
The graph is permanently enriched. Future AIs will use this exact incident to solve tomorrow's problems.

> [!NOTE]
> Throughout this journey, the human did not type a single paragraph of summary. They acted as a reviewer and approver.

---

## Chapter 4: AI Workforce

Helix is not a single LLM. It is an orchestrated workforce of specialized agents.

*   **Evidence Agent**: 
    *   *Role*: Ingests raw data (logs, PDFs, emails) and structures it.
    *   *Trigger*: New data uploaded or API event.
*   **Timeline Agent**: 
    *   *Role*: Extracts timestamps from all evidence to build a perfect chronological chain of events.
    *   *Trigger*: Evidence Agent completes ingestion.
*   **Knowledge Agent**: 
    *   *Role*: Queries the vector database of all historical investigations, SOPs, and CAPAs to find semantic matches.
*   **Root Cause Agent**: 
    *   *Role*: Synthesizes evidence and history to formulate the "Why". Generates hypotheses and assigns confidence scores.
    *   *Output*: A structured "5 Whys" or Fishbone analysis.
*   **CAPA Agent**: 
    *   *Role*: Translates the root cause into actionable, preventative steps.
*   **Compliance Agent**: 
    *   *Role*: The "devil's advocate." Audits the AI's own work against CFR regulations before the human sees it.
*   **Risk Agent**: 
    *   *Role*: Calculates severity, occurrence, and detectability (FMEA).
*   **Executive Briefing Agent**: 
    *   *Role*: Distills complex, 50-page investigations into a 1-page executive summary.
*   **Confidence Agent**: 
    *   *Role*: Calculates the statistical confidence of the entire narrative. Identifies what missing piece of evidence would mathematically increase confidence the most.

*Failure Handling*: If any agent fails or produces low-confidence output, the system gracefully degrades, pausing the automated workflow and highlighting the exact point of uncertainty for the human to resolve.

---

## Chapter 5: Automation Blueprint

Every action in Helix is event-driven.

*   **Trigger**: An external system (ERP, LIMS, SCADA) or a human creates a Deviation.
*   **AI Action**: The orchestration engine fires the Evidence Agent → Timeline Agent → Knowledge Agent in parallel.
*   **Human Checkpoint 1 (Triage)**: The human reviews the auto-gathered evidence and missing evidence requests. They supply the missing pieces.
*   **AI Action**: Root Cause Agent and CAPA Agent recalculate based on new evidence.
*   **Human Checkpoint 2 (Adjudication)**: The QA Analyst reviews the AI's hypothesis and drafted CAPA. They make edits (which the AI learns from) and sign off.
*   **Approval Routing**: Helix automatically routes to the correct approvers based on the Risk Agent's score. (e.g., High Risk = Plant Manager; Low Risk = QA Manager).
*   **Notification**: Approvers receive highly contextual notifications (e.g., in MS Teams or email) with the Executive Briefing Agent's summary.

---

## Chapter 6: EvidenceOps Engine

At its core, Helix is a graph reasoning engine.
*   **How evidence flows**: Data enters via API or UI. It is immediately vectorized and mapped as nodes in a graph database (e.g., Node: Equipment-A, Node: Operator-B, Edge: Operated_By).
*   **How relationships are built**: The Knowledge Agent creates semantic edges between new deviations and historical ones based on latent similarities, not just keyword matches.
*   **How confidence changes**: Confidence is a dynamic calculation based on the density of the evidence graph. More corroborating evidence = higher confidence. Contradictory evidence (e.g., two witness statements that don't match) drastically lowers confidence until a human resolves the conflict.
*   **How AI learns**: When a QA Analyst edits an AI-drafted root cause, the engine logs the diff. The system fine-tunes its contextual understanding, ensuring it never makes the same inferential mistake twice.

---

## Chapter 7: Enterprise UX

**Design Philosophy**: The UI must look like a command center, not a tax form. It should be dark-mode optimized, utilizing glassmorphism, dynamic micro-animations, and high data density without clutter.

*   **Dashboard**: A living pulse of the factory. Not just pie charts, but a real-time feed of active agents processing deviations.
*   **Investigations (List)**: Triage view. Sortable by AI Confidence and Risk Score, not just date.
*   **Investigation Detail**: The heart of Helix. A split-pane view. Left side: The narrative (Hypotheses, CAPA draft). Right side: The Evidence panel (Timeline, Logs).
*   **Timeline**: A scrubbable, horizontal timeline that visually aligns disparate events (alarms, logins, actions) down to the millisecond.
*   **Evidence Graph**: A highly interactive, force-directed graph. Users can drag nodes, expand relationships, and visually "see" the incident.
*   **Runtime/AI Thoughts**: A specialized panel showing the AI's internal thought process. Users can see *how* the Root Cause agent arrived at its conclusion. This builds trust.
*   **Approvals**: Frictionless, one-click biometric sign-offs with 21 CFR Part 11 compliant audit trails visible instantly.

*Why it exists*: To make the invisible (complex relationships) visible.
*What AI is doing*: Updating the UI dynamically via WebSockets as new insights are generated.
*What humans are doing*: Navigating the graph, verifying the timeline, and making decisions.

---

## Chapter 8: Executive Experience

**The CEO View:**
The CEO opens Helix on their iPad while in transit.
*   **Immediate Understanding**: They see the "Enterprise Risk Posture" – a single metric indicating the health of the quality system. They see a feed of *only* critical, systemic issues.
*   **2-Minute Decision**: They click into a critical deviation. They do not see 50 pages of text. They see the Executive Briefing:
    *   *Issue*: Bioreactor contamination.
    *   *Root Cause*: Filter failure.
    *   *Financial Impact*: $2M batch loss.
    *   *Proposed Fix*: Supplier audit and switch to Vendor B.
*   They click "Approve". The signature is cryptographically secured. They close the app.

---

## Chapter 9: Quality Analyst Experience

**Minute by Minute:**
*   **08:00**: Analyst logs in. Helix Dashboard shows 3 new deviations that occurred overnight.
*   **08:02**: Opens Deviation 1. Helix has already gathered all logs and run the analysis.
*   **08:05**: Analyst reviews the AI's timeline. It looks perfectly aligned.
*   **08:10**: Analyst reviews the primary hypothesis. Helix states with 95% confidence that the root cause was a power dip causing a PLC reset.
*   **08:12**: Analyst checks the "AI Reasoning" panel. Helix links to the exact facility power log showing a voltage drop at 03:14 AM.
*   **08:15**: Analyst agrees. They review the auto-drafted CAPA to install an uninterruptible power supply (UPS) on the PLC.
*   **08:18**: Analyst clicks "Submit for QA Approval."
*   *An investigation that used to take 3 weeks of meetings and data gathering was completed in 18 minutes.*

---

## Chapter 10: Demo Story

**The Perfect 5-Minute Hackathon Demo:**

*(Stage is dark. Screen illuminates with the sleek, dark-mode Helix Dashboard. A dramatic, subtle hum plays in the background.)*

**Minute 1: The Incident (The "Wow" factor)**
"Welcome to EvidenceOps. At 2:00 AM last night, a critical deviation occurred on our manufacturing line. In legacy systems, a human would be typing up a report right now. In Helix, watch this."
*We click into the deviation. The screen is already populated. The AI is typing the final summary live.*

**Minute 2: The Graph (The Technical Marvel)**
"Helix didn't just log an error. It built a neural map of the event."
*We switch to the Evidence Graph. We see nodes expanding beautifully—connecting the machine, the operator, and the exact SOP.*
"It found that this exact failure happened 4 years ago in a different facility."

**Minute 3: The AI Reasoning (Building Trust)**
"But AI is a black box, right? Not in Helix."
*We open the AI Runtime panel. We see the Root Cause Agent explaining its logic step-by-step, assigning a 92% confidence score.*
"The AI identified a missing piece of evidence—the operator's training log. It pinged the HR system, retrieved it, and realized the operator wasn't certified for the override they performed."

**Minute 4: The Adjudication (Human Accountability)**
"The AI did the heavy lifting. Now, the human adjudicates."
*We act as the QA Analyst, reviewing the drafted CAPA, making one small edit to the wording, and applying our cryptographic signature to approve it.*

**Minute 5: The Impact**
"What used to take three weeks, six meetings, and endless copy-pasting, took us three minutes. We didn't build a better form. We built an autonomous investigator. We built EvidenceOps."

---

## Chapter 11: Competitive Analysis

*   **Legacy Systems (TrackWise, MasterControl, Sparta)**: These are relational databases. They are digital filing cabinets. They rely 100% on human data entry and human reasoning. Helix is an active participant.
*   **Modern QMS (Veeva Quality)**: Great UX, cloud-native, but still fundamentally a passive workflow tool. It routes documents beautifully, but it does not *reason* about the contents of those documents.
*   **General AI (Microsoft Copilot)**: Copilot can summarize a document you feed it. But it doesn't know how to proactively query a SCADA system, build a deterministic timeline, or calculate regulatory compliance risk. It is a generalist; Helix is a domain-expert workforce.
*   **Big Data Platforms (Palantir Foundry, ServiceNow GRC)**: Palantir builds incredible ontologies, but it requires armies of forward-deployed engineers to set up and maintain. Helix is out-of-the-box EvidenceOps specifically tuned for CAPA and quality deviations.

**What makes Helix fundamentally different?**
Helix flips the paradigm. Instead of the human driving the system, the system drives the investigation, presenting the human with a high-confidence, fully-cited case file for review.

---

## Chapter 12: North Star Principles

**These are the immutable laws of Helix (FounderOS Principles):**

1.  **Zero Blank Canvas**: A user should never stare at a blank text box. The system must always provide a highly contextualized first draft.
2.  **Explainability is Non-Negotiable**: An AI hypothesis without citations to specific, traceable evidence is worthless and dangerous.
3.  **Human Accountability, Machine Speed**: The AI can propose anything, but a human must sign everything. The system optimizes the time *between* human decisions.
4.  **Evidence is Immutable**: Once ingested, evidence cannot be altered, only appended or contextualized. The audit trail is sacred.
5.  **Design for the Adjudicator**: The UX must be optimized for reviewing, comparing, and verifying information, not data entry. It must feel premium, responsive, and alive.

---
*End of Document. Designed for Project Helix, Phase 0.*

