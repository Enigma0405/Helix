"""Export Service: handles PDF report generation using WeasyPrint (or reportlab/fpdf2 fallback) and uploads to MinIO."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_runtime.models import CAPA, Hypothesis
from src.core.audit import write_audit_log
from src.core.config import settings
from src.core.storage import get_presigned_url, upload_file
from src.evidence.models import EvidenceItem
from src.export.models import Export
from src.investigation.models import Investigation

logger = logging.getLogger("helix.export.service")

# Setup Jinja2 environment for HTML template loading
_TEMPLATE_DIR = Path(__file__).parent / "templates"
jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)

# Robust import check for WeasyPrint
try:
    from weasyprint import CSS, HTML
    WEASYPRINT_AVAILABLE = True
except Exception:
    WEASYPRINT_AVAILABLE = False
    logger.warning("WeasyPrint is not available (lack of GTK libs or ImportError). PDF export will fallback to ReportLab/Simple generator.")


async def generate_pdf_report(
    db: AsyncSession,
    investigation_id: uuid.UUID,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Export:
    """Generate a PDF report of the investigation and save it to MinIO.

    Pulls all evidence, hypotheses, and CAPA, compiles them into a HTML template,
    runs PDF generation, uploads to MinIO, and creates an Export record.
    """
    # 1. Fetch Investigation
    stmt = select(Investigation).where(
        Investigation.id == investigation_id, Investigation.org_id == org_id
    )
    res = await db.execute(stmt)
    investigation = res.scalar_one_or_none()
    if not investigation:
        raise ValueError("Investigation not found")

    # 2. Fetch Evidence Items
    stmt_ev = select(EvidenceItem).where(
        EvidenceItem.investigation_id == investigation_id,
        EvidenceItem.org_id == org_id,
    )
    res_ev = await db.execute(stmt_ev)
    evidence_items = res_ev.scalars().all()

    # 3. Fetch Hypotheses
    stmt_hyp = select(Hypothesis).where(
        Hypothesis.investigation_id == investigation_id,
        Hypothesis.org_id == org_id,
    ).order_by(Hypothesis.confidence_score.desc())
    res_hyp = await db.execute(stmt_hyp)
    hypotheses = res_hyp.scalars().all()

    # 4. Fetch CAPA
    stmt_capa = select(CAPA).where(
        CAPA.investigation_id == investigation_id,
        CAPA.org_id == org_id,
    )
    res_capa = await db.execute(stmt_capa)
    capa = res_capa.scalar_one_or_none()

    # 5. Get Audit Logs for timeline
    from src.core.audit import AuditLog  # noqa: PLC0415
    stmt_audit = select(AuditLog).where(
        AuditLog.org_id == org_id,
        AuditLog.entity_id == investigation_id,
    ).order_by(AuditLog.timestamp.asc())
    res_audit = await db.execute(stmt_audit)
    audit_logs = res_audit.scalars().all()

    # 6. Render HTML Content
    template = jinja_env.get_template("report.html")
    html_content = template.render(
        investigation=investigation,
        evidence_items=evidence_items,
        hypotheses=hypotheses,
        capa=capa,
        audit_logs=audit_logs,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
    )

    # 7. Generate PDF bytes
    if WEASYPRINT_AVAILABLE:
        try:
            pdf_bytes = HTML(string=html_content).write_pdf(
                stylesheets=[CSS(string="@page { margin: 1.5cm; }")]
            )
        except Exception as e:
            logger.error("WeasyPrint pdf writing failed: %s. Using fallback.", e)
            pdf_bytes = _generate_fallback_pdf(investigation, evidence_items, hypotheses, capa)
    else:
        pdf_bytes = _generate_fallback_pdf(investigation, evidence_items, hypotheses, capa)

    # 8. Upload to MinIO
    filename = f"report-{investigation_id}-{int(datetime.now(timezone.utc).timestamp())}.pdf"
    storage_key = f"exports/{org_id}/{investigation_id}/{filename}"

    await upload_file(
        bucket=settings.MINIO_BUCKET_EXPORTS,
        object_name=storage_key,
        data=pdf_bytes,
        content_type="application/pdf",
    )

    # 9. Create Export record in DB
    export_record = Export(
        investigation_id=investigation_id,
        org_id=org_id,
        format="pdf",
        storage_key=storage_key,
        created_by=user_id,
    )
    db.add(export_record)
    await db.commit()
    await db.refresh(export_record)

    # Write audit log
    await write_audit_log(
        db=db,
        org_id=org_id,
        entity_type="export",
        entity_id=export_record.id,
        action="create",
        actor_id=user_id,
        diff={"format": "pdf", "filename": filename},
        request_path=f"/api/investigations/{investigation_id}/export",
    )

    return export_record


def _generate_fallback_pdf(
    investigation: Investigation,
    evidence_items: list[EvidenceItem],
    hypotheses: list[Hypothesis],
    capa: CAPA | None,
) -> bytes:
    """Generate a clean fallback PDF using ReportLab if WeasyPrint is missing or errors out."""
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=15,
    )
    story.append(Paragraph(f"Project Helix Investigation Report", title_style))
    story.append(Paragraph(f"<b>Title:</b> {investigation.title}", styles["Normal"]))
    story.append(Paragraph(f"<b>Status:</b> {investigation.status.upper()} | <b>Severity:</b> {investigation.severity.upper()}", styles["Normal"]))
    story.append(Spacer(1, 15))

    # Description
    story.append(Paragraph("<b>Description:</b>", styles["Heading3"]))
    story.append(Paragraph(investigation.description or "No description provided.", styles["BodyText"]))
    story.append(Spacer(1, 15))

    # Evidence Inventory
    story.append(Paragraph("<b>Evidence Inventory:</b>", styles["Heading3"]))
    evidence_data = [["Filename", "Type", "Status"]]
    for item in evidence_items:
        evidence_data.append([item.original_filename, item.mime_type, item.status])

    t_ev = Table(evidence_data, colWidths=[250, 150, 100])
    t_ev.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(t_ev)
    story.append(Spacer(1, 15))

    # Root Cause Hypotheses
    story.append(Paragraph("<b>Root Cause Hypotheses:</b>", styles["Heading3"]))
    for hyp in hypotheses:
        story.append(Paragraph(f"<b>{hyp.title}</b> (Confidence: {hyp.confidence_score or 'N/A'}, Grounding: {hyp.grounding_score or 'N/A'})", styles["Normal"]))
        story.append(Paragraph(hyp.content, styles["BodyText"]))
        story.append(Spacer(1, 10))

    # CAPA Section
    story.append(Paragraph("<b>Corrective and Preventive Action (CAPA) Plan:</b>", styles["Heading3"]))
    if capa:
        story.append(Paragraph(f"<b>Status:</b> {capa.status.upper()}", styles["Normal"]))
        story.append(Paragraph(capa.content, styles["BodyText"]))
    else:
        story.append(Paragraph("No CAPA draft generated yet.", styles["BodyText"]))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


async def get_export_with_url(
    db: AsyncSession,
    export_id: uuid.UUID,
    org_id: uuid.UUID,
) -> tuple[Export, str]:
    """Retrieve an Export record and generate a temporary presigned download URL."""
    stmt = select(Export).where(Export.id == export_id, Export.org_id == org_id)
    res = await db.execute(stmt)
    export_record = res.scalar_one_or_none()
    if not export_record:
        raise ValueError("Export record not found")

    url = await get_presigned_url(
        bucket=settings.MINIO_BUCKET_EXPORTS,
        object_name=export_record.storage_key,
        expires_seconds=3600,
    )
    return export_record, url
