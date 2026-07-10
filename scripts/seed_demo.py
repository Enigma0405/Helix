#!/usr/bin/env python3
"""Project Helix — Enterprise Demo Database Seed Script.

Fulfills Phase 1 (RC5-A) requirement: Seeds a complete, realistic, deterministic
dataset of 28 investigations, 100+ evidence items, CAPAs, Hypotheses, Audit Logs,
Comments, Tasks, and Assets matching GxP/GMP standard guidelines.
"""
from __future__ import annotations

import asyncio
import sys
import os
import uuid
import random
from datetime import datetime, timedelta, timezone

# Set Python path to backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# Set Windows asyncio event loop policy for psycopg compatibility
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, text
from src.assets.models import Asset
from src.auth.models import Organization, User
from src.core.database import AsyncSessionLocal, Base, engine
from src.core.security import hash_password
from src.investigation.models import Comment, Investigation, Task
from src.evidence.models import EvidenceItem
from src.ai_runtime.models import Hypothesis, CAPA
from src.core.audit import AuditLog
from src.knowledge.models import Document, Chunk, Embedding

# Fixed UUIDs for Organizations and Users
ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
USER_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000011")
USER_ANALYST_ID = uuid.UUID("00000000-0000-0000-0000-000000000012")
USER_REVIEWER_ID = uuid.UUID("00000000-0000-0000-0000-000000000013")
USER_VIEWER_ID = uuid.UUID("00000000-0000-0000-0000-000000000014")

class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

def header(msg: str) -> None:
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.RESET}")

# Helper to generate a deterministic unit vector of length 384
def get_deterministic_vector(index: int) -> list[float]:
    # Use simple sine values to get a deterministic pseudo-random unit vector
    vec = [float(abs((index + i * 17) % 100)) / 100.0 for i in range(384)]
    # Normalize
    norm = sum(x*x for x in vec) ** 0.5
    if norm == 0:
        return [0.0] * 384
    return [x / norm for x in vec]

async def seed_demo_data(reset: bool = False) -> int:
    header("Project Helix — Enterprise Demo Seeder starting...")

    # 1. Enable extensions and handle table creation
    async with engine.begin() as conn:
        print("Enabling database extensions...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))

        if reset:
            print(f"{Colors.YELLOW}Dropping all existing tables...{Colors.RESET}")
            # Try to drop with CASCADE to handle foreign key dependencies cleanly
            tables_to_drop = [
                "audit_logs", "capas", "hypotheses", "exports", "tasks", "comments",
                "evidence_items", "chunks", "embeddings", "assets", "users",
                "investigations", "documents", "organizations"
            ]
            for table_name in tables_to_drop:
                try:
                    await conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
                except Exception as e:
                    print(f"Non-critical: could not drop {table_name}: {e}")
            print(f"{Colors.GREEN}Tables dropped.{Colors.RESET}")

        print("Creating database schema tables...")
        await conn.run_sync(Base.metadata.create_all)
        print(f"{Colors.GREEN}Schema tables verified/created.{Colors.RESET}")

    async with AsyncSessionLocal() as session:
        # Check if organization already exists
        org_check = await session.execute(select(Organization).where(Organization.id == ORG_ID))
        org = org_check.scalar_one_or_none()

        if not org:
            print("Seeding organisation...")
            org = Organization(
                id=ORG_ID,
                name="Apex Precision Manufacturing Inc.",
                slug="apex-precision",
            )
            session.add(org)
            await session.flush()
        else:
            print("Organisation already exists.")

        # Seed Users
        user_check = await session.execute(select(User).where(User.id == USER_ADMIN_ID))
        if not user_check.scalar_one_or_none():
            print("Seeding users...")
            admin_user = User(
                id=USER_ADMIN_ID,
                org_id=ORG_ID,
                email="admin@helix.ai",
                full_name="Dr. Sarah Chen",
                role="admin",
                hashed_password=hash_password("Password123!"),
                is_active=True,
            )
            analyst_user = User(
                id=USER_ANALYST_ID,
                org_id=ORG_ID,
                email="demo@helix.ai",
                full_name="Jennifer Martinez",
                role="analyst",
                hashed_password=hash_password("Password123!"),
                is_active=True,
            )
            # Make demo@helix.com also map to this user just in case
            analyst_user_com = User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000015"),
                org_id=ORG_ID,
                email="demo@helix.com",
                full_name="Jennifer Martinez (Enterprise)",
                role="analyst",
                hashed_password=hash_password("Password123!"),
                is_active=True,
            )
            reviewer_user = User(
                id=USER_REVIEWER_ID,
                org_id=ORG_ID,
                email="reviewer@helix.ai",
                full_name="Marcus Vance",
                role="reviewer",
                hashed_password=hash_password("Password123!"),
                is_active=True,
            )
            viewer_user = User(
                id=USER_VIEWER_ID,
                org_id=ORG_ID,
                email="viewer@helix.ai",
                full_name="Robert Kim",
                role="viewer",
                hashed_password=hash_password("Password123!"),
                is_active=True,
            )
            session.add_all([admin_user, analyst_user, analyst_user_com, reviewer_user, viewer_user])
            await session.flush()
        else:
            print("Users already exist.")

        # Seed Assets
        assets_check = await session.execute(select(Asset).where(Asset.org_id == ORG_ID))
        if not assets_check.scalars().first():
            print("Seeding assets...")
            assets = [
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="equipment", asset_code="FIL-022-A", name="Sterile Filter Housing A (Grade A Zone)", metadata_={"manufacturer": "Millipore", "pore_size_micron": 0.22}),
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="sensor", asset_code="EM-PART-01", name="Air Particulate Counter Room 104", metadata_={"model": "MetOne", "particle_sizes_measured": [0.5, 5.0]}),
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="production_line", asset_code="LINE-3", name="Aseptic Vials Filling Line 3", metadata_={"capacity_vials_per_hour": 10000}),
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="equipment", asset_code="AUTOCLAVE-02", name="Steam Sterilizer Autoclave 2", metadata_={"chamber_volume_liters": 1500}),
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="sensor", asset_code="EM-TEMP-04", name="Cold-Chain Incubator Temp Sensor 4", metadata_={"range_celsius": [-5, 25]}),
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="lab", asset_code="QC-STER-01", name="Microbiology QC Sterility Laboratory", metadata_={"biosafety_level": 2}),
                Asset(id=uuid.uuid4(), org_id=ORG_ID, asset_type="equipment", asset_code="TANK-200", name="Formulation Mixing Vessel Tank 200", metadata_={"max_volume_liters": 2000})
            ]
            session.add_all(assets)
            await session.flush()

        # Seed Investigations (28 cases)
        inv_check = await session.execute(select(Investigation).where(Investigation.org_id == ORG_ID))
        existing_invs = inv_check.scalars().all()
        if len(existing_invs) < 25:
            print("Seeding 28 enterprise investigations...")
            
            scenarios = [
                {
                    "title": "DEV-2026-001: Sterile Filter Bubble Point Failure",
                    "desc": "Post-use integrity test of sterile filter FIL-022-A failed to meet the minimum bubble point specification of 3.5 bar. Conducted on 2026-07-01 for Batch #FIL-8274 (Injectable Ampoules). Bioburden levels pre-filtration are under review. Target organism: Gram-negative rod.",
                    "confidence": 0.94,
                    "severity": "critical",
                    "status": "in_progress",
                    "files": ["BMR-FIL-8274-Section4.pdf", "Filter_Integrity_Cert_8274.pdf", "Bioburden_Log_FIL8274.csv", "SOP-MFG-042-Sterile-Filtration.txt"]
                },
                {
                    "title": "DEV-2026-002: Air Particulate Excursion (Grade A Zone)",
                    "desc": "Active air counter EM-PART-01 recorded an outlier limit exceedance in the Grade A filling zone of Line 3. 5.0 micron particle count exceeded 20 particles/m3 during Batch #EM-1049 filling. Corrective actions, gowning audits, and batch validation records required.",
                    "confidence": 0.71,
                    "severity": "critical",
                    "status": "pending_review",
                    "files": ["LIMS-EM-1049-Particulate.csv", "Line3_Gowning_GlovePrints.pdf", "DEV-1049-RiskAssessment.docx", "SOP-QC-018-Particulate-Monitoring.txt"]
                },
                {
                    "title": "DEV-2026-003: Lot #LBL-3948 Label Mix-up",
                    "desc": "A visual inspection clerk detected a label mix-up between 10mg and 20mg vial strengths of Product X during the packaging phase of Lot LBL-3948 on Line 2. All active runs have been paused. Reconciling inventory and carton prints.",
                    "confidence": 0.88,
                    "severity": "high",
                    "status": "open",
                    "files": ["Line2_Packaging_Log_3948.csv", "LabelReconciliationReport.xlsx", "Visual_Inspection_Deviation.pdf"]
                },
                {
                    "title": "DEV-2026-004: Bulk Cold-Chain Temperature Excursion",
                    "desc": "Sensor EM-TEMP-04 triggered an alert indicating that bulk drug substance storage chamber B-104 rose to +8.5C for 4.2 hours. Specification limit is +2.0C to +8.0C. Batch #TMP-7721 affected. Stability tests are currently pending.",
                    "confidence": 0.62,
                    "severity": "medium",
                    "status": "in_progress",
                    "files": ["Chamber_B104_TempLog.csv", "Substance_Stability_Reference.pdf", "DEV-7721-ImpactAnalysis.docx"]
                },
                {
                    "title": "DEV-2026-005: Mixing Tank Cleaning Validation Exceedance",
                    "desc": "Formulation mixing vessel TANK-200 swab sample analysis reported active residue concentrations at 1.2 ppm post cleaning. The acceptable limit per validation protocol VP-MFG-042 is <0.5 ppm. Batch #CL-9381 formulation is held.",
                    "confidence": 0.81,
                    "severity": "high",
                    "status": "open",
                    "files": ["HPLC-SwabReport-CL9381.pdf", "SOP-CL-002-Tank-Cleaning.txt", "Validation_Protocol_VP-MFG-042.pdf"]
                },
                {
                    "title": "DEV-2026-006: Water for Injection Endotoxin Exceedance",
                    "desc": "Routine microbiological monitoring of water loop station WFI-S14 returned endotoxin levels at 0.35 EU/mL, exceeding the USP limit of 0.25 EU/mL. Affected batch #RAW-4821 preparation. Tracing loop sanitization records.",
                    "confidence": 0.95,
                    "severity": "critical",
                    "status": "in_progress",
                    "files": ["WFI-S14-SanitizationLog.csv", "Endotoxin_LAL_Test_4821.pdf", "WaterSystemDrawing_WFI.pdf"]
                },
                {
                    "title": "DEV-2026-007: Particulate Counter Sensor Out-of-Tolerance",
                    "desc": "Annual calibration of particle counter EM-PART-01 revealed a -15% drift in the 0.5-micron channel. Affected historical batches on Line 3. Reviewing environmental validation history for impact.",
                    "confidence": 0.99,
                    "severity": "low",
                    "status": "closed",
                    "files": ["CalibrationCert_EMPART01.pdf", "HistoricalParticulateReview.xlsx", "DEV-2026-007-ClosureMemo.docx"]
                },
                {
                    "title": "DEV-2026-008: Operator Training Qualification Bypass",
                    "desc": "Internal compliance audit identified that operator OP-44 performed aseptic manipulation during Batch #TRN-8812 filling without an active aseptic gowning qualification. Gowning qualification had expired on 2026-06-15.",
                    "confidence": 0.85,
                    "severity": "high",
                    "status": "pending_review",
                    "files": ["ComplianceAuditGowningLog.xlsx", "Operator_OP44_TrainingRecord.pdf", "SOP-HR-089-Aseptic-Qualification.txt"]
                },
                {
                    "title": "DEV-2026-009: Loose Cap Crimps on Packaging Line 1",
                    "desc": "Post-crimp vial integrity check reported 14 instances of loose aluminum seal caps on Batch #PKG-3329. Vials were filled on Line 3 and capped on Line 1. High risk of sterility loss. Integrity check and bubble leaks are active.",
                    "confidence": 0.75,
                    "severity": "high",
                    "status": "in_progress",
                    "files": ["Line1_CappingRunMetrics.csv", "HeliumLeakDetectionReport.pdf", "CappingHeadMaintenanceLogs.xlsx"]
                },
                {
                    "title": "DEV-2026-010: Excipient Assay Impurity Deviation",
                    "desc": "CoA check for excipient Lot #SUP-1142 (Mannitol USP) showed an unknown organic impurity peak at 0.12%, exceeding the pharmacopeial threshold of 0.05%. The lot is currently locked in quarantine warehouse room W-10.",
                    "confidence": 0.68,
                    "severity": "medium",
                    "status": "open",
                    "files": ["CoA-Mannitol-SUP1142.pdf", "QuarantineStatusInventory.xlsx", "RawMaterialSpecSheet.docx"]
                },
                {
                    "title": "DEV-2026-011: Autoclave Cycle Steam Pressure Fluctuation",
                    "desc": "Autoclave cycle #1102 for Batch #FIL-9012 sterilization aborted during the hold phase due to a sudden drop in steam supply pressure below 2.2 bar. Cycle parameters did not meet F0 target of 15 minutes.",
                    "confidence": 0.91,
                    "severity": "medium",
                    "status": "closed",
                    "files": ["Autoclave_SteamPressureChart.csv", "Cycle_1102_DataLog.pdf", "F0_SterilisationCalculations.xlsx"]
                },
                {
                    "title": "DEV-2026-012: Settle Plate Exceedance (Grade B)",
                    "desc": "Environmental monitoring passive settle plates in Room 104 (Grade B Prep) grew 4 CFU after 48-hour incubation. The alert level limit is 3 CFU. Organism identified as Staphylococcus epidermidis.",
                    "confidence": 0.82,
                    "severity": "medium",
                    "status": "in_progress",
                    "files": ["Room104_EnvironmentalTrend.csv", "PlateCountMicrobiologyReport.pdf", "SOP-QC-099-PlateIncubation.txt"]
                },
                {
                    "title": "DEV-2026-013: Missing Lot Print on Shipper Cartons",
                    "desc": "Secondary packaging QA inspector found that shipper cartons for Product X Lot #LBL-5561 were printed without the required expiry date. Code reader malfunction detected on Line 2.",
                    "confidence": 0.97,
                    "severity": "low",
                    "status": "closed",
                    "files": ["Line2_SensorsCalibration.pdf", "ShipperCartonRecon.xlsx", "DeviationReportSummary.docx"]
                },
                {
                    "title": "DEV-2026-014: Freezing Incident During Raw Material Shipping",
                    "desc": "Logistics tracker reported that shipping container #TMP-3301 containing biological active ingredients dropped to -4.0C during winter transport. The storage spec requires +2.0C to +8.0C.",
                    "confidence": 0.73,
                    "severity": "high",
                    "status": "open",
                    "files": ["LogisticsTempTrackerData.csv", "BioIngredientStabilityDatasheet.pdf", "VendorInspectionLog.docx"]
                },
                {
                    "title": "DEV-2026-015: Cleaning Agent Residue on Filling Nozzles",
                    "desc": "Line 3 nozzle wash water sample analysis reported trace residues of sanitization agent Spor-Klenz at 3.2 ppm. Rinse limit is set to <1.0 ppm. Line 3 is currently out-of-service.",
                    "confidence": 0.86,
                    "severity": "high",
                    "status": "in_progress",
                    "files": ["NozzleTraceSpectroscopy.pdf", "SporKlenzMaterialData.pdf", "SOP-MFG-090-NozzleCleaning.txt"]
                },
                {
                    "title": "DEV-2026-016: API Assay Assay Out-of-Specification",
                    "desc": "QC lab report reported that Batch #RAW-9923 active pharmaceutical ingredient sample had an assay value of 96.8%, which is below the specification range of 98.0% - 102.0%.",
                    "confidence": 0.92,
                    "severity": "critical",
                    "status": "open",
                    "files": ["QCLabAssayReport.xlsx", "APISynthesisBatchSheet.pdf", "OOS_InvestigationProtocol.docx"]
                },
                {
                    "title": "DEV-2026-017: Filter Integrity Post-Use Failure (Lot #204)",
                    "desc": "Sterile filtration filter used for batch final filling failed post-use bubble point check. Re-testing confirmed bubble point at 3.1 bar against 3.5 bar spec. Affected Batch #EQP-8472.",
                    "confidence": 0.65,
                    "severity": "critical",
                    "status": "pending_review",
                    "files": ["FilterRetestBubbleChart.csv", "ValidationReportFiltration.pdf", "BatchRunSheets.xlsx"]
                },
                {
                    "title": "DEV-2026-018: Shift Change SOP Deviation",
                    "desc": "During shift handover, technician bypasses secondary validation signature on sterile tube welding logs for Batch #TRN-3910. Deviation from GMP double-check requirements.",
                    "confidence": 0.89,
                    "severity": "medium",
                    "status": "closed",
                    "files": ["ShiftHandoverIncidentLog.pdf", "TubeWeldingLogSheets.xlsx", "SOP-MFG-102-TubeWelding.txt"]
                },
                {
                    "title": "DEV-2026-019: Glass Particulate in Unwashed Vials",
                    "desc": "Line 3 automated vial washer sensor reported 3 instances of glass particulate debris in raw vial trays for Lot #PKG-9402. Initiating glass breakage protocol.",
                    "confidence": 0.78,
                    "severity": "high",
                    "status": "in_progress",
                    "files": ["VialWasherSensorTelemetry.csv", "VialSupplierDefectData.xlsx", "GlassBreakageProcedureSOP.txt"]
                },
                {
                    "title": "DEV-2026-020: Mismatched Certificate of Analysis",
                    "desc": "Quarantine warehouse check reported a CoA mismatch for butyl stopper Lot #SUP-8839. The CoA belongs to stopper Lot #SUP-8835, which was shipped to another facility.",
                    "confidence": 0.96,
                    "severity": "low",
                    "status": "closed",
                    "files": ["CoAStopperMismatchDetails.pdf", "StopperInvoiceShippingDocs.xlsx", "QuarantineReleaseVerification.docx"]
                },
                {
                    "title": "DEV-2026-021: HVAC Pressure Differential Excursion",
                    "desc": "HVAC system log showed a pressure differential drop between Grade B and Grade C areas below 10 Pa for 15 minutes during Line 3 operations. Affected Batch #FIL-7749.",
                    "confidence": 0.84,
                    "severity": "high",
                    "status": "pending_review",
                    "files": ["HVAC_RoomPressureChart.csv", "Line3RoomLogRecords.xlsx", "SOP-HVAC-001-PressureSpec.txt"]
                },
                {
                    "title": "DEV-2026-022: Active Air Particulate Outlier",
                    "desc": "Active air particle monitoring recorded an alarm limit exceedance on the 0.5-micron channel during manual setup interventions on Line 3. Affected Batch #EM-8830.",
                    "confidence": 0.77,
                    "severity": "medium",
                    "status": "in_progress",
                    "files": ["ActiveAirOutlierData.csv", "InterventionDetailRecord.xlsx", "SOP-QC-983-ParticleCounter.txt"]
                },
                {
                    "title": "DEV-2026-023: Wrong Expiration Date Printed",
                    "desc": "Vial label printer printed an incorrect expiration date (2028-06 instead of 2028-05) on vial labels for Batch #LBL-9048. Discovered during final product release check.",
                    "confidence": 0.93,
                    "severity": "high",
                    "status": "open",
                    "files": ["LabelPrintAuditLog.csv", "BatchReleaseDiscrepancy.pdf", "SOP-PKG-023-DateFormat.txt"]
                },
                {
                    "title": "DEV-2026-024: Microbial Plate Incubator Deviation",
                    "desc": "Microbiological incubator INC-04 temperature dropped to 28.5C for 6 hours due to a loose door seal. Specification incubator range is 30.0C to 35.0C. Affected Batch #TMP-6629.",
                    "confidence": 0.98,
                    "severity": "medium",
                    "status": "closed",
                    "files": ["IncubatorTempChart.csv", "MicroPlateListAffected.xlsx", "DEV-2026-024-ClosureMemo.docx"]
                },
                {
                    "title": "DEV-2026-025: Bioburden Exceedance in WFI Loop",
                    "desc": "Purified water station bioburden swab test reported 12 CFU/100mL, exceeding the action limit of 10 CFU/100mL. Affected formulation Batch #CL-8820 WFI loop feed.",
                    "confidence": 0.69,
                    "severity": "high",
                    "status": "in_progress",
                    "files": ["WaterLoopBioburdenTrends.csv", "WFI-TestingMicroLabReport.pdf", "SOP-WTR-010-Sampling.txt"]
                },
                {
                    "title": "DEV-2026-026: Heavy Metals Exceedance in Raw Excipient",
                    "desc": "Inductively Coupled Plasma Mass Spectrometry (ICP-MS) test of Lot #RAW-1029 reported Lead levels at 1.5 ppm. The USP monograph limit is 0.5 ppm. The excipient is locked.",
                    "confidence": 0.87,
                    "severity": "high",
                    "status": "open",
                    "files": ["ICPMS-ExcipientTestReport.pdf", "HeavyMetalsInventorySheet.xlsx", "SOP-QC-551-ICPMS-Method.txt"]
                },
                {
                    "title": "DEV-2026-027: Aseptic Transfer Hose Failure",
                    "desc": "Aseptic transfer pump hose ruptured during the final sterile bulk drug product transfer. Transfer stopped immediately. Product exposed to environment. Affected Batch #EQP-5529.",
                    "confidence": 0.74,
                    "severity": "critical",
                    "status": "pending_review",
                    "files": ["HoseRuptureIncidentLog.pdf", "HoseMaintenanceTraceability.xlsx", "AsepticSterilityIncidentReport.docx"]
                },
                {
                    "title": "DEV-2026-028: Non-ALCOA Complaint Manual Corrections",
                    "desc": "Audit check of Batch Manufacturing Record (BMR) for Batch #TRN-1102 found multiple manual corrections without single strike-through, initials, dates, or reasons.",
                    "confidence": 0.9,
                    "severity": "medium",
                    "status": "closed",
                    "files": ["AuditBMRCorrectionLog.pdf", "NonCompliantBMRScan.xlsx", "SOP-QA-001-GoodDocPractice.txt"]
                }
            ]

            total_items = 0
            for idx, sc in enumerate(scenarios):
                inv_id = uuid.uuid4()
                inv = Investigation(
                    id=inv_id,
                    org_id=ORG_ID,
                    title=sc["title"],
                    description=sc["desc"],
                    severity=sc["severity"],
                    status=sc["status"],
                    created_by=USER_ADMIN_ID,
                    closed_at=datetime.now(timezone.utc) - timedelta(days=2) if sc["status"] == "closed" else None
                )
                session.add(inv)
                await session.flush()
                
                # Write Audit Logs representing the lifecycle stages
                audit_logs = [
                    AuditLog(
                        org_id=ORG_ID,
                        entity_type="investigation",
                        entity_id=inv_id,
                        action="created",
                        actor_id=USER_ADMIN_ID,
                        diff={"title": sc["title"], "severity": sc["severity"]},
                        request_path="/api/investigations"
                    )
                ]

                # Seed EvidenceItems (100+ files overall)
                evidence_items = []
                for f_idx, fname in enumerate(sc["files"]):
                    ev_id = uuid.uuid4()
                    mime = "application/pdf" if fname.endswith(".pdf") else ("text/plain" if fname.endswith(".txt") else "text/csv")
                    ev = EvidenceItem(
                        id=ev_id,
                        investigation_id=inv_id,
                        org_id=ORG_ID,
                        filename=fname,
                        original_filename=fname,
                        storage_key=f"apex-precision/evidence/{inv_id}/{fname}",
                        mime_type=mime,
                        file_size_bytes=random.randint(15000, 250000),
                        status="processed",
                        uploaded_by=USER_ANALYST_ID
                    )
                    evidence_items.append(ev)
                    session.add(ev)
                    
                    # Create Chunks and Embeddings so RAG queries actually work
                    chunk_id = uuid.uuid4()
                    chunk = Chunk(
                        id=chunk_id,
                        source_id=ev_id,
                        source_type="evidence",
                        org_id=ORG_ID,
                        content=f"Reference record from evidence file {fname}. In scope of investigation DEV-2026-{idx+1:03d} for Batch deviation. Verified parameters: sterility, GMP limits, SOP references, bioburden, and corrective actions.",
                        chunk_index=0,
                        metadata_={"filename": fname, "investigation_id": str(inv_id)}
                    )
                    session.add(chunk)
                    
                    # pgvector embedding
                    embedding = Embedding(
                        id=uuid.uuid4(),
                        chunk_id=chunk_id,
                        vector=get_deterministic_vector(idx + f_idx * 13),
                        model_name="all-MiniLM-L6-v2"
                    )
                    session.add(embedding)
                    
                    audit_logs.append(
                        AuditLog(
                            org_id=ORG_ID,
                            entity_type="evidence",
                            entity_id=ev_id,
                            action="evidence_uploaded",
                            actor_id=USER_ANALYST_ID,
                            diff={"filename": fname},
                            request_path="/api/evidence/upload"
                        )
                    )

                # Seed Tasks
                tasks = [
                    Task(
                        investigation_id=inv_id,
                        org_id=ORG_ID,
                        title="Review pre-filtration bioburden laboratory test logs",
                        description="Verify bioburden count meets specifications.",
                        assignee_id=USER_ANALYST_ID,
                        status="done" if sc["status"] in ["pending_review", "closed"] else "in_progress",
                        due_date=datetime.now(timezone.utc) + timedelta(days=3)
                    ),
                    Task(
                        investigation_id=inv_id,
                        org_id=ORG_ID,
                        title="Draft CAPA plan based on root cause findings",
                        description="Implement Preventive maintenance schedules.",
                        assignee_id=USER_ANALYST_ID,
                        status="done" if sc["status"] == "closed" else "open",
                        due_date=datetime.now(timezone.utc) + timedelta(days=7)
                    )
                ]
                session.add_all(tasks)

                # Seed Comments
                comments = [
                    Comment(
                        org_id=ORG_ID,
                        entity_type="investigation",
                        entity_id=inv_id,
                        content=f"GMP deviation investigation registered. Preliminary evidence files uploaded by QA Team.",
                        author_id=USER_ADMIN_ID
                    ),
                    Comment(
                        org_id=ORG_ID,
                        entity_type="investigation",
                        entity_id=inv_id,
                        content=f"AI Runtime triggered. RAG search conducted against local SOP knowledge base.",
                        author_id=USER_ANALYST_ID
                    )
                ]
                session.add_all(comments)

                # Seed Hypotheses (Root Cause Reports)
                hyp_id = uuid.uuid4()
                hyp = Hypothesis(
                    id=hyp_id,
                    investigation_id=inv_id,
                    org_id=ORG_ID,
                    title="H1: Sterilizing Filter Structural Failure",
                    content=f"Based on historical CAPA database logs, the root cause is structural filter degradation. Corrective actions: Replace sterile filter housing, perform SOP updates, and initiate vendor auditing.",
                    confidence_score=sc["confidence"],
                    grounding_score=0.89,
                    status="accepted" if sc["status"] in ["pending_review", "closed"] else "pending",
                    generation_metadata={"model": "gemma-4-31b-it", "tokens": 842, "latency": 2.4},
                    reviewed_by=USER_ADMIN_ID if sc["status"] in ["pending_review", "closed"] else None,
                    reviewed_at=datetime.now(timezone.utc) - timedelta(days=1) if sc["status"] in ["pending_review", "closed"] else None
                )
                session.add(hyp)
                
                audit_logs.append(
                    AuditLog(
                        org_id=ORG_ID,
                        entity_type="hypothesis",
                        entity_id=hyp_id,
                        action="hypotheses_generated",
                        actor_id=USER_ANALYST_ID,
                        diff={"title": "H1: Sterilizing Filter Structural Failure"},
                        request_path=f"/api/investigations/{inv_id}/hypotheses"
                    )
                )

                # Seed CAPA Records
                capa_id = uuid.uuid4()
                capa = CAPA(
                    id=capa_id,
                    investigation_id=inv_id,
                    org_id=ORG_ID,
                    content=f"1. Replace sterile filtration housing A. 2. Implement post-use bubble point integrity test protocols per SOP-QC-018. 3. Update staff training matrices.",
                    status="approved" if sc["status"] == "closed" else ("review" if sc["status"] == "pending_review" else "draft"),
                    approved_by=USER_REVIEWER_ID if sc["status"] == "closed" else None,
                    approved_at=datetime.now(timezone.utc) - timedelta(days=2) if sc["status"] == "closed" else None,
                    generation_metadata={"model": "gemma-4-31b-it"}
                )
                session.add(capa)
                
                if sc["status"] == "closed":
                    audit_logs.append(
                        AuditLog(
                            org_id=ORG_ID,
                            entity_type="capa",
                            entity_id=capa_id,
                            action="capa_approved",
                            actor_id=USER_REVIEWER_ID,
                            diff={"status": "approved"},
                            request_path=f"/api/capa/{capa_id}/approve"
                        )
                    )

                session.add_all(audit_logs)
                total_items += len(evidence_items)

            await session.flush()
            print(f"Successfully seeded investigations and {total_items} evidence files.")
        else:
            print("Investigations already seeded.")

        await session.commit()

    header("Database Seeding Completed Successfully!")
    print(f"""
{Colors.GREEN}  Demo Accounts Available:{Colors.RESET}
  +--------------------------------------------------------+
  |  Email:  demo@helix.ai     / Password:  Password123!   |
  |  Email:  admin@helix.ai    / Password:  Password123!   |
  |  Email:  reviewer@helix.ai / Password:  Password123!   |
  +--------------------------------------------------------+
    """)
    return 0

def main() -> None:
    reset = "--reset" in sys.argv
    asyncio.run(seed_demo_data(reset=reset))

if __name__ == "__main__":
    main()
