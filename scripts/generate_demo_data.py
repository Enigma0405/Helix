#!/usr/bin/env python3
"""
Project Helix — Demo Data Generation Script
=============================================
Generates synthetic demonstration data for the Apex Precision Manufacturing
dataset. Produces realistic pharmaceutical quality documents.

Generates:
    - 3 SOPs (Standard Operating Procedures)
    - 5 historical CAPA summaries
    - 2 additional investigation scenarios

Usage:
    python scripts/generate_demo_data.py
    python scripts/generate_demo_data.py --output-dir sample_data/generated
"""

import json
import os
import sys
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Color output
# ---------------------------------------------------------------------------
class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

def ok(msg): print(f"{Colors.GREEN}  ✅ {msg}{Colors.RESET}")
def info(msg): print(f"{Colors.CYAN}  ℹ  {msg}{Colors.RESET}")
def header(msg):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'─' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}  {msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'─' * 60}{Colors.RESET}")


# ===========================================================================
# SOP Templates
# ===========================================================================

SOPS = [
    {
        "filename": "SOP-MFG-042-Rev-C-Sterile-Filtration.txt",
        "metadata": {
            "document_number": "SOP-MFG-042",
            "revision": "Rev C",
            "title": "Sterile Filtration of Injectable Products",
            "effective_date": "2024-03-01",
            "review_date": "2025-03-01",
            "department": "Manufacturing",
            "author": "Robert Kim",
            "approved_by": "Dr. Sarah Chen",
            "classification": "GMP Critical",
        },
        "content": """STANDARD OPERATING PROCEDURE
Document Number: SOP-MFG-042 Rev C
Title: Sterile Filtration of Injectable Products
Effective Date: 2024-03-01 | Department: Manufacturing
Approved By: Dr. Sarah Chen (VP Quality)

1. PURPOSE AND SCOPE
1.1 This SOP describes the requirements for sterile filtration of liquid
    injectable products at Apex Precision Manufacturing Inc. (APM).
1.2 This procedure applies to all liquid injectable products manufactured
    in Building A — Sterile Manufacturing.
1.3 This procedure covers 0.22 micron sterilizing-grade filtration using
    validated filter systems.

2. REFERENCES
2.1 USP <71> Sterility Tests
2.2 PDA TR26 — Sterilizing Filtration of Liquids
2.3 FDA Guidance: Sterile Drug Products Produced by Aseptic Processing
2.4 EU GMP Annex 1 (2022 revision)
2.5 SOP-QC-018 — Filter Integrity Testing
2.6 Validation Protocol VP-MFG-042 — Sterile Filtration Process Validation

3. MATERIALS AND EQUIPMENT
3.1 Sterilizing-grade 0.22 micron filter (Millipore Durapore or equivalent)
3.2 Stainless steel filter housing (autoclaved per SOP-MFG-015)
3.3 Peristaltic pump (calibrated per PM schedule)
3.4 Integrity tester (Sartocheck 5 Plus or equivalent)
3.5 Bioburden test kits (pre-filtration sampling)

4. PRE-FILTRATION REQUIREMENTS
4.1 FILTER INTEGRITY TESTING (PRE-USE)
    4.1.1 Perform bubble point test on each filter prior to use.
          Acceptance criterion: ≥ 3.5 bar (50 psi) for 0.22 micron
          PVDF filter.
    4.1.2 Perform forward flow (diffusion flow) test.
          Acceptance criterion: ≤ 6.0 mL/min at 2.5 bar test pressure.
    4.1.3 Document results in Batch Manufacturing Record (BMR).
    4.1.4 REJECT and replace filter if either test fails. Initiate
          deviation DEV form immediately.

4.2 PRE-FILTRATION BIOBURDEN
    4.2.1 Sample pre-filtration bulk for bioburden per SOP-QC-020.
    4.2.2 Acceptance criterion: ≤ 10 CFU/100mL.
    4.2.3 Do NOT proceed with filtration if bioburden limit is exceeded.

5. FILTRATION PROCEDURE
5.1 Don sterile gowning per SOP-GMP-005 before entering Grade A zone.
5.2 Verify filter housing assembly integrity (no bypass connections).
5.3 Flush filter with WFI (Water for Injection): minimum 500 mL.
5.4 Connect product container under Grade A LAF protection.
5.5 Begin filtration at controlled flow rate: 2–10 L/hour (per product specification).
5.6 Monitor inlet pressure throughout; alert if pressure exceeds 3.0 bar.
5.7 Maintain Grade A conditions (particle count < 3,520 particles/m³ ≥ 0.5 micron).
5.8 Complete filtration within validated hold time: maximum 8 hours.

6. POST-FILTRATION INTEGRITY TEST
6.1 Perform post-use filter integrity test immediately after filtration.
    This is mandatory and non-negotiable.
6.2 Same acceptance criteria as pre-use (4.1.1 and 4.1.2).
6.3 CRITICAL: If post-use integrity test FAILS:
    6.3.1 QUARANTINE all filtered product immediately.
    6.3.2 Issue Critical Deviation report within 2 hours.
    6.3.3 Notify QA Supervisor and batch is placed on hold.
    6.3.4 Batch cannot be released until investigation is completed.
    6.3.5 Retain failed filter for investigation analysis.

7. DOCUMENTATION
7.1 All results must be recorded in real-time in the Batch Manufacturing Record.
7.2 Operator and verifier signatures required for each step.
7.3 Any deviation from this SOP requires a deviation report (DEV form).

8. TRAINING REQUIREMENTS
8.1 All operators must complete SOP-MFG-042 training annually.
8.2 New operators must be qualified under supervision for 3 batches minimum.
8.3 Training records maintained in TrackWise QMS.

REVISION HISTORY:
Rev C (2024-03-01): Added mandatory post-use integrity test for ALL filtration
                    operations (previously only required for pilot batches).
                    Updated acceptance criteria for bubble point test.
Rev B (2022-11-15): Added pre-filtration bioburden sampling requirement.
Rev A (2020-06-01): Initial issue.
""",
    },
    {
        "filename": "SOP-ENV-011-Rev-B-Environmental-Monitoring.txt",
        "metadata": {
            "document_number": "SOP-ENV-011",
            "revision": "Rev B",
            "title": "Environmental Monitoring — Classified Areas",
            "effective_date": "2024-01-15",
            "review_date": "2025-01-15",
            "department": "Quality Control",
            "author": "Dr. Amir Patel",
            "approved_by": "Michael O'Brien",
        },
        "content": """STANDARD OPERATING PROCEDURE
Document Number: SOP-ENV-011 Rev B
Title: Environmental Monitoring — Classified Areas (Grade A/B/C/D)
Effective Date: 2024-01-15 | Department: Quality Control

1. PURPOSE
This SOP defines the environmental monitoring (EM) program for all classified
manufacturing areas at Apex Precision Manufacturing Inc., in compliance with
EU GMP Annex 1, ISO 14644, and PDA TR13.

2. MONITORING PROGRAM OVERVIEW
Classified area monitoring includes:
  (a) Active air sampling — viable particulate
  (b) Settle plates — passive settle plate method (TSA agar)
  (c) Surface sampling — contact plates and swabs
  (d) Personnel monitoring — glove and gown contact plates
  (e) Non-viable particle counting (continuous for Grade A)

3. GRADE A ZONE REQUIREMENTS (Fill Zone, LAF Cabinets)

3.1 ALERT AND ACTION LIMITS (EU GMP Annex 1 — Table 2)

    Settle Plates (90mm, 4h exposure):
      Alert limit:  1 CFU/plate
      Action limit: 1 CFU/plate (Grade A — same as alert; any growth = action)

    Active Air Sampling (RCS or SAS):
      Alert limit:  < 1 CFU/m³
      Action limit: 1 CFU/m³

    Surface Sampling (contact plates):
      Alert limit:  1 CFU/plate
      Action limit: 1 CFU/plate

3.2 MONITORING FREQUENCY (Grade A)
    Active air: Every batch (during aseptic operations)
    Settle plates: Every batch (exposed during operations)
    Surface sampling: After each batch campaign
    Personnel monitoring: Each operator, each entry into Grade A

3.3 TREND ANALYSIS
    QC Microbiology reviews EM data weekly and monthly.
    Any upward trend — even below alert limits — must be investigated.
    Three consecutive alert-level results in Grade A trigger a full investigation.

4. EXCEEDANCE RESPONSE
4.1 When an ACTION LIMIT is exceeded in Grade A:
    Step 1: Notify QA immediately (within 30 minutes of confirmed result).
    Step 2: Investigate root cause — review fill suite entries, gowning records,
            HVAC data, and filter integrity records.
    Step 3: Issue Deviation Report (DEV form) within 24 hours.
    Step 4: Consider impact assessment for all batches manufactured since
            last clean EM result.
    Step 5: Do not resume manufacturing until corrective action implemented
            and QA approval obtained.

5. ORGANISM IDENTIFICATION
5.1 All isolates from Grade A must be identified to species level.
5.2 Gram-negative organisms in Grade A require immediate investigation.
5.3 Organisms of concern (requires escalation to VP Quality):
    - Burkholderia cepacia complex
    - Pseudomonas aeruginosa
    - Any Gram-negative rod in fill zone
    - Any black mold (Aspergillus niger, Cladosporium spp.)

REVISION HISTORY:
Rev B (2024-01-15): Updated Grade A alert/action limits per EU GMP Annex 1
                    (2022 revision). Added organism identification requirements.
Rev A (2019-06-01): Initial issue.
""",
    },
    {
        "filename": "SOP-GMP-005-Rev-D-Sterile-Gowning.txt",
        "metadata": {
            "document_number": "SOP-GMP-005",
            "revision": "Rev D",
            "title": "Sterile Gowning Procedure — Grade A/B Areas",
            "effective_date": "2023-09-01",
            "department": "Manufacturing / Quality",
            "author": "Jennifer Martinez",
            "approved_by": "Dr. Sarah Chen",
        },
        "content": """STANDARD OPERATING PROCEDURE
Document Number: SOP-GMP-005 Rev D
Title: Sterile Gowning Procedure — Grade A/B Areas
Effective Date: 2023-09-01

1. PURPOSE
Defines the aseptic gowning sequence for personnel entering Grade A (fill zone)
and Grade B (background environment) classified areas at APM.

2. GOWNING SEQUENCE — GRADE B ENTRY
Step 1:  Remove personal clothing; place in locker.
Step 2:  Wash hands for minimum 30 seconds with antiseptic soap.
Step 3:  Don Grade B coverall (sterile, single-use or laundered).
Step 4:  Don sterile hood (cover all hair).
Step 5:  Don sterile face mask (cover mouth and nose completely).
Step 6:  Don sterile overshoes.
Step 7:  Apply sterile gloves (latex-free, powder-free).
Step 8:  Apply 70% isopropyl alcohol hand sanitizer over gloves.

3. GOWNING SEQUENCE — GRADE A ENTRY (additional steps)
Step 9:  In Grade B ante-room, don sterile Grade A gown over Grade B gown.
Step 10: Don sterile glove liner, then second pair of sterile gloves.
Step 11: Apply sterile goggles or face shield.
Step 12: Sanitize outer gloves with 70% IPA before entering Grade A.
Step 13: Complete glove gowning record (time, operator ID, batch number).

4. CRITICAL REQUIREMENTS
4.1 NO skin exposure is permitted in Grade A. Any skin exposure requires
    the operator to exit and re-gown.
4.2 Gloves must be sanitized with IPA every 30 minutes during Grade A operations.
4.3 Personnel with respiratory infection, skin lesions, or open wounds
    are prohibited from Grade A entry.
4.4 Maximum consecutive time in Grade A: 2 hours before mandatory break.

5. GOWNING QUALIFICATION
5.1 New personnel must pass gowning qualification (3 consecutive satisfactory
    gowning assessments) before unsupervised Grade A entry.
5.2 Annual re-qualification required for all Grade A personnel.
5.3 Failed gowning qualification requires retraining and re-assessment.

REVISION HISTORY:
Rev D (2023-09-01): Added mandatory glove sanitization every 30 minutes.
                    Added maximum 2-hour Grade A stay requirement.
""",
    },
]

# ===========================================================================
# CAPA Summary Templates
# ===========================================================================

CAPAS = [
    {
        "id": "CAPA-2023-087",
        "title": "Environmental Monitoring Grade B Deviation — Fill Suite Ante-Room",
        "status": "closed",
        "severity": "major",
        "opened_date": "2023-07-12",
        "closed_date": "2023-10-30",
        "root_cause": "HVAC filter change procedure did not adequately account for re-establishment of airflow patterns. The Grade B ante-room particle count exceeded action limits for 2 consecutive monitoring cycles following a scheduled HVAC maintenance event.",
        "corrective_actions": [
            "Revised HVAC maintenance SOP to include 48-hour re-qualification monitoring period after filter changes",
            "Installed continuous particle monitoring in Grade B ante-room",
            "Retrained all maintenance personnel on classified area re-qualification requirements",
        ],
        "effectiveness_check": "Satisfactory. Zero EM exceedances in 3 months following implementation.",
        "regulatory_refs": ["EU GMP Annex 1", "ISO 14644-2"],
    },
    {
        "id": "CAPA-2023-041",
        "title": "Filter Integrity Test Failure — Post-Use — Batch 2791",
        "status": "closed",
        "severity": "critical",
        "opened_date": "2023-03-08",
        "closed_date": "2023-06-15",
        "root_cause": "Post-use forward flow test failure on 0.22 micron filter for batch 2791. Root cause determined to be filter housing o-ring degradation due to incompatible cleaning solvent (isopropanol concentration exceeded validated limit). Product from batch 2791 failed sterility testing.",
        "corrective_actions": [
            "Batch 2791 rejected and destroyed",
            "Revised cleaning SOP to specify maximum IPA concentration for filter housing components",
            "Added o-ring inspection step to filter assembly procedure",
            "Qualified alternative o-ring material (EPDM) resistant to cleaning solvents",
            "Implemented 100% post-use integrity testing (previously only 50% of batches)",
        ],
        "effectiveness_check": "Satisfactory. No filter integrity failures in 8 months post-implementation.",
        "regulatory_refs": ["PDA TR26", "21 CFR 211.113", "USP <71>"],
    },
    {
        "id": "CAPA-2022-118",
        "title": "Lyophilizer Contamination Event — Cycle Deviation",
        "status": "closed",
        "severity": "major",
        "opened_date": "2022-11-03",
        "closed_date": "2023-02-28",
        "root_cause": "Lyophilizer chamber door gasket failure allowed ambient air ingress during the primary drying phase. Pressure deviation alarm was acknowledged by operator but investigation was delayed, resulting in potential contamination of 2 batches.",
        "corrective_actions": [
            "Immediate quarantine of affected batches pending testing",
            "Replaced all lyophilizer door gaskets (preventive replacement schedule established)",
            "Implemented pressure deviation auto-hold (batch cannot continue without QA notification)",
            "Revised operator response procedure for lyophilizer alarms",
        ],
        "effectiveness_check": "Satisfactory. Lyophilizer operating within specification for 6 months.",
        "regulatory_refs": ["21 CFR 211.68", "EU GMP Annex 1"],
    },
    {
        "id": "CAPA-2024-003",
        "title": "Sterility Test False Positive Investigation",
        "status": "closed",
        "severity": "major",
        "opened_date": "2024-01-22",
        "closed_date": "2024-04-10",
        "root_cause": "Investigation of apparent sterility test failure for batch 2821 revealed laboratory-induced contamination during test setup. The isolate (Staphylococcus epidermidis) was identified as a common skin commensal consistent with test laboratory environmental flora, not product contamination. Sterility test was invalidated per USP <71> criteria.",
        "corrective_actions": [
            "Enhanced sterility test setup area cleaning and gowning requirements",
            "Implemented positive-pressure isolator for all sterility test transfers",
            "Added environmental monitoring controls to sterility testing laboratory",
            "Retrained all QC microbiology analysts on aseptic technique",
        ],
        "effectiveness_check": "Satisfactory. No test-related invalid sterility tests in 6 months.",
        "regulatory_refs": ["USP <71>", "EU GMP Annex 2"],
    },
    {
        "id": "CAPA-2024-031",
        "title": "Gowning Qualification Failure — Grade A Operator",
        "status": "open",
        "severity": "minor",
        "opened_date": "2024-09-14",
        "closed_date": None,
        "root_cause": "Operator failed second gowning assessment — failure mode was incomplete coverage of hair at nape of neck, identified during personnel monitoring (elevated colony count on hood contact plate). Operator has been restricted from Grade A operations pending requalification.",
        "corrective_actions": [
            "Operator removed from Grade A duties pending retraining",
            "One-on-one gowning retraining completed with QA Lead",
            "Re-assessment scheduled for 2024-10-01",
        ],
        "effectiveness_check": "Pending — re-assessment not yet completed.",
        "regulatory_refs": ["EU GMP Annex 1", "SOP-GMP-005"],
    },
]

# ===========================================================================
# Additional Investigation Scenarios
# ===========================================================================

ADDITIONAL_INVESTIGATIONS = [
    {
        "filename": "lot_a192_potency_out_of_specification.json",
        "data": {
            "id": "inv-a192-potency-2024",
            "title": "Lot A192 — Potency Out of Specification",
            "investigation_number": "DEV-2024-0756",
            "status": "in_progress",
            "severity": "major",
            "product": "Injectable Product X (50mL vials)",
            "batch_lot": "A192",
            "manufacturing_date": "2024-09-15",
            "test_date": "2024-09-28",
            "description": "Potency assay (HPLC) for lot A192 returned a result of 87.3% of label claim against a specification of 90.0%–110.0%. The result is out of specification (OOS). A Phase I laboratory investigation confirmed the original result. Phase II manufacturing investigation is ongoing. The batch is on hold pending investigation completion.",
            "potential_root_causes": [
                "API weighing error during compounding",
                "Degradation due to light exposure during manufacturing",
                "HPLC calibration issue (ruled out — confirmed by SST)",
            ],
            "expected_root_causes": [
                "API weighing error (balance calibration drift)",
                "Incorrect raw material assay value applied",
                "Compounding calculation error",
            ],
            "tags": ["potency", "oos", "hplc", "api", "major"],
            "regulatory_refs": ["21 CFR 211.192", "FDA OOS Guidance 2006", "ICH Q6A"],
        },
    },
    {
        "filename": "line_3_cross_contamination_risk.json",
        "data": {
            "id": "inv-line3-xcontam-2024",
            "title": "Line 3 — Potential Cross-Contamination Risk Assessment",
            "investigation_number": "DEV-2024-0834",
            "status": "open",
            "severity": "major",
            "product": "Sterile Ophthalmic Drops Y",
            "batch_lot": "Multiple (B901, B902, B903)",
            "manufacturing_date": "2024-10-01",
            "description": "During scheduled cleaning verification sampling, trace amounts of Injectable Product X active ingredient were detected on Product Line 3 equipment after changeover to Sterile Ophthalmic Drops Y manufacturing. Detected concentration: 0.3 ppm (limit: < 0.1 ppm). Three batches of Ophthalmic Drops Y (B901, B902, B903) manufactured on Line 3 after the changeover are on hold pending investigation.",
            "potential_root_causes": [
                "Inadequate cleaning procedure for Line 3 changeover",
                "Insufficient cleaning validation coverage for new API combination",
                "Equipment design gap (difficult to clean area identified)",
            ],
            "expected_root_causes": [
                "Cleaning procedure inadequacy for new product combination",
                "Cleaning validation not performed for Injectable X → Ophthalmic Y changeover",
            ],
            "tags": ["cross-contamination", "cleaning-validation", "ophthalmic", "hold"],
            "regulatory_refs": [
                "21 CFR 211.67", "EMA/CHMP/CVMP/SWP/169430/2012",
                "PIC/S PI 006 — Cleaning Validation"
            ],
        },
    },
]


# ===========================================================================
# File generation
# ===========================================================================

def generate_sops(output_dir: Path) -> None:
    """Generate SOP text files."""
    header("Generating SOPs")
    sop_dir = output_dir / "sops"
    sop_dir.mkdir(parents=True, exist_ok=True)

    for sop in SOPS:
        # Write the SOP content as plain text
        txt_path = sop_dir / sop["filename"]
        txt_path.write_text(sop["content"], encoding="utf-8")
        ok(f"SOP: {sop['filename']}")

        # Write metadata JSON alongside
        meta_filename = sop["filename"].replace(".txt", "_metadata.json")
        meta_path = sop_dir / meta_filename
        meta_path.write_text(json.dumps(sop["metadata"], indent=2), encoding="utf-8")
        info(f"  Metadata: {meta_filename}")


def generate_capas(output_dir: Path) -> None:
    """Generate CAPA summary JSON files."""
    header("Generating CAPA Summaries")
    capa_dir = output_dir / "capas"
    capa_dir.mkdir(parents=True, exist_ok=True)

    for capa in CAPAS:
        filename = f"{capa['id'].lower().replace('-', '_')}.json"
        path = capa_dir / filename
        path.write_text(json.dumps(capa, indent=2), encoding="utf-8")
        status_icon = "✅" if capa["status"] == "closed" else "🔄"
        ok(f"{status_icon} CAPA: {filename} [{capa['status']}]")


def generate_investigations(output_dir: Path) -> None:
    """Generate additional investigation scenario files."""
    header("Generating Additional Investigation Scenarios")
    inv_dir = output_dir / "investigations"
    inv_dir.mkdir(parents=True, exist_ok=True)

    for scenario in ADDITIONAL_INVESTIGATIONS:
        path = inv_dir / scenario["filename"]
        path.write_text(json.dumps(scenario["data"], indent=2), encoding="utf-8")
        ok(f"Investigation: {scenario['filename']}")


def generate_manifest(output_dir: Path) -> None:
    """Generate a manifest of all generated files."""
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generator": "scripts/generate_demo_data.py",
        "sops": [s["filename"] for s in SOPS],
        "capas": [f"{c['id'].lower().replace('-', '_')}.json" for c in CAPAS],
        "investigations": [s["filename"] for s in ADDITIONAL_INVESTIGATIONS],
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    ok(f"Manifest: {manifest_path}")


# ===========================================================================
# Main
# ===========================================================================

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Project Helix — Demo Data Generation Script"
    )
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).parent.parent / "sample_data" / "generated"),
        help="Output directory for generated files",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{Colors.BOLD}Project Helix — Demo Data Generator{Colors.RESET}")
    print(f"Output directory: {output_dir.resolve()}\n")

    generate_sops(output_dir)
    generate_capas(output_dir)
    generate_investigations(output_dir)
    generate_manifest(output_dir)

    print(f"\n{Colors.GREEN}{Colors.BOLD}✅ Data generation complete!{Colors.RESET}")
    print(f"  Generated: {len(SOPS)} SOPs, {len(CAPAS)} CAPAs, {len(ADDITIONAL_INVESTIGATIONS)} investigations")
    print(f"  Location: {output_dir.resolve()}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
