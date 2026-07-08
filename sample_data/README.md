# 🏭 Sample Data — Apex Precision Manufacturing Demo Dataset

This directory contains the **Apex Precision Manufacturing** synthetic dataset used for the Project Helix hackathon demo. All data is entirely fictional and designed to showcase the platform's capabilities in a realistic pharmaceutical/medical device quality engineering context.

---

## Company Profile

**Apex Precision Manufacturing Inc.** is a fictional mid-market pharmaceutical and medical device contract manufacturer. The dataset simulates a real-world quality investigation workflow.

---

## Dataset Structure

```
sample_data/
├── README.md                          # This file
└── apex_precision/
    ├── company_profile.json           # Company metadata
    └── investigations/
        └── batch_2847_sterility_failure.json  # Demo investigation scenario
```

---

## Demo Workflow

The sample data supports the following 5-minute demo workflow:

### Step 1: Show the company context
Open `apex_precision/company_profile.json` — explain the company context to judges.

### Step 2: Seed the database
```bash
python scripts/seed.py
```
This creates the organization, demo users, and the Batch #2847 investigation.

### Step 3: Log in
Navigate to [http://localhost](http://localhost) and log in as `demo@helix.ai / helixdemo2024`.

### Step 4: Show the investigation
The "Batch #2847 — Sterility Failure" investigation is pre-populated with:
- Investigation metadata (title, severity, description)
- Linked evidence documents (SOPs, batch records, EM reports)

### Step 5: Trigger AI analysis
Click "Analyze" to run the hypothesis generation pipeline. With `INFERENCE_PROVIDER=fireworks`, this hits Gemma 3 on AMD MI300X.

### Step 6: Review results
Show the ranked hypotheses with citation grounding scores.

---

## Files Explained

| File | Purpose | Used In Demo At |
|------|---------|----------------|
| `company_profile.json` | Company context and regulatory scope | Step 1 (context setting) |
| `investigations/batch_2847_sterility_failure.json` | Primary demo investigation | Steps 4–6 |

---

## Data Generation

To generate additional synthetic scenarios beyond the included data:

```bash
python scripts/generate_demo_data.py
```

This generates:
- 3 synthetic SOPs (plain text → converted to PDF in production)
- 5 historical CAPA summaries
- 2 additional investigation scenarios

---

## Important Note

All data in this directory is **100% synthetic**. Any resemblance to real companies, products, batches, or regulatory actions is purely coincidental. This data is for demonstration and evaluation purposes only.
