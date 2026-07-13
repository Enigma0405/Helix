# Demo Dataset & Tenant Context

To demonstrate the power of EvidenceOps immediately upon login, the Helix database is seeded with a highly realistic, interconnected dataset representing a pharmaceutical manufacturing environment.

## The Tenant: Aetheris BioPharma
Aetheris BioPharma is a fictional mid-sized pharmaceutical manufacturer specializing in sterile injectables. 
- **Site:** VISK Site (Hyderabad, India)
- **Primary Product:** Product X (Sterile Vials)

## The Core Scenario: Sterile Filter Integrity Failure
The primary demo scenario showcases how Helix handles a complex operational deviation.

### 1. The Operational Event
An Environmental Monitoring (EM) excursion occurs in the Grade B corridor. Shortly after, a post-use sterile filter (EQ-FIL-008) fails its integrity test.

### 2. The Organization Memory (Seeded Ground Truth)
The database is seeded with canonical documents that Helix uses to reason about this event:
- **SOP-STER-014 (Sterilization Procedures):** States clearly that "Filters must undergo a minimum of 5 minutes of continuous wetting prior to initiating the forward flow integrity test."
- **Equipment Record (EQ-FIL-008):** Metadata indicating it is an Emflon II filter by Pall Corporation, and its calibration expired on July 12.
- **Historical CAPA (CAPA-2023-081):** A past investigation resolving an identical false-failure caused by insufficient wetting time.

### 3. The Helix Action (What the Demo Shows)
When the user uploads the raw CSV log or LIMS report indicating the filter failure:
1. Helix cross-verifies the event against the Organization Memory.
2. It detects the violated SOP (the operator only wet the filter for 2 minutes).
3. It detects the historical similarity (CAPA-2023-081).
4. It detects the overdue calibration status of the equipment.
5. It deterministically drafts a CAPA recommending the quarantine of the batch and a re-test following the proper 5-minute protocol.

## Seeded Entities

### Users
- **Demo User (Admin/Analyst):** `demo@helix.ai` or `sarah.chen@apex.com` (Password: `Password123`)

### Investigations
- `DEV-2026-003: Lot #LBL-3948 Label Mix-up` (Status: Open, Severity: High)
- `INV-2026-042: Temperature Excursion in Cold Storage` (Status: Closed)

### Evidence Files
- `Line2_Packaging_Log_3948.csv` (Mock uploaded evidence)
- `LabelReconciliationReport.xlsx` (Mock uploaded evidence)

By relying on this rich, interconnected dataset, the Helix UI avoids looking like an empty "0 Events" dashboard and immediately proves the business value of the Organization Memory architecture to judges and investors.
