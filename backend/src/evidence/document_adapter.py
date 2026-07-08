"""Document adapter pattern: pluggable parsers for different file types.

Each adapter extracts (text, metadata) from a raw bytes payload.
New formats can be added without modifying the processing pipeline.
"""
from __future__ import annotations

import csv
import io
import logging
from typing import Protocol, runtime_checkable

logger = logging.getLogger(__name__)


@runtime_checkable
class DocumentAdapter(Protocol):
    """Protocol that all document adapters must satisfy."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        """Return True if this adapter can process the given file."""
        ...

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        """Extract text and metadata from raw file bytes.

        Args:
            data: Raw file content as bytes.
            filename: Original filename (used for extension hints).

        Returns:
            Tuple of (extracted_text, metadata_dict).
            metadata_dict may contain keys like: page_count, word_count, author, etc.
        """
        ...


class PDFAdapter:
    """Extract text from PDF files using pdfplumber."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        return mime_type == "application/pdf" or filename.lower().endswith(".pdf")

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        """Extract full text from all PDF pages.

        Args:
            data: Raw PDF bytes.
            filename: Original PDF filename.

        Returns:
            (full_text, {"page_count": N, "filename": filename})
        """
        try:
            import pdfplumber  # noqa: PLC0415
        except ImportError as e:
            raise RuntimeError("pdfplumber is required for PDF processing") from e

        pages_text: list[str] = []
        page_count = 0

        with pdfplumber.open(io.BytesIO(data)) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)

        full_text = "\n\n".join(pages_text)
        metadata = {
            "page_count": page_count,
            "filename": filename,
            "adapter": "pdf",
        }
        logger.debug("PDFAdapter extracted %d chars from %d pages", len(full_text), page_count)
        return full_text, metadata


class DOCXAdapter:
    """Extract text from DOCX files using python-docx."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        return (
            mime_type
            in {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
            }
            or filename.lower().endswith(".docx")
        )

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        """Extract paragraph text from a DOCX file.

        Args:
            data: Raw DOCX bytes.
            filename: Original DOCX filename.

        Returns:
            (full_text, {"paragraph_count": N, "filename": filename})
        """
        try:
            from docx import Document  # noqa: PLC0415
        except ImportError as e:
            raise RuntimeError("python-docx is required for DOCX processing") from e

        doc = Document(io.BytesIO(data))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n\n".join(paragraphs)
        metadata = {
            "paragraph_count": len(paragraphs),
            "filename": filename,
            "adapter": "docx",
        }
        logger.debug("DOCXAdapter extracted %d paragraphs", len(paragraphs))
        return full_text, metadata


class CSVAdapter:
    """Extract text from CSV files by converting rows to readable format."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        return mime_type in {"text/csv", "application/csv"} or filename.lower().endswith(".csv")

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        """Extract CSV as tab-separated text for embedding.

        Args:
            data: Raw CSV bytes.
            filename: Original CSV filename.

        Returns:
            (formatted_text, {"row_count": N, "col_count": N, "filename": filename})
        """
        text_data = data.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text_data))
        rows = list(reader)
        if not rows:
            return "", {"row_count": 0, "col_count": 0, "filename": filename, "adapter": "csv"}

        headers = rows[0]
        col_count = len(headers)
        lines = ["\t".join(headers)]

        for row in rows[1:]:
            # Label each cell with its column header for semantic meaning
            labeled = ", ".join(
                f"{h}: {v}" for h, v in zip(headers, row) if v.strip()
            )
            if labeled:
                lines.append(labeled)

        full_text = "\n".join(lines)
        metadata = {
            "row_count": len(rows) - 1,
            "col_count": col_count,
            "filename": filename,
            "adapter": "csv",
        }
        logger.debug("CSVAdapter extracted %d rows, %d cols", len(rows) - 1, col_count)
        return full_text, metadata


class ImageAdapter:
    """Stub adapter for image files — future OCR integration point."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        return mime_type.startswith("image/") or filename.lower().endswith(
            (".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif", ".webp")
        )

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        """Stub: returns placeholder text until OCR is implemented.

        In a future iteration this will call an OCR service (e.g., Tesseract,
        Google Vision, or AWS Textract) to extract text from image bytes.
        """
        logger.warning(
            "ImageAdapter: OCR not yet implemented for %s — returning empty text", filename
        )
        return "", {
            "filename": filename,
            "adapter": "image_stub",
            "ocr_status": "not_implemented",
        }


class EmailAdapter:
    """Stub adapter for email files (.eml, .msg) — future integration point."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        return mime_type in {"message/rfc822"} or filename.lower().endswith((".eml", ".msg"))

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        """Stub: minimal email parsing until dedicated email processor is built."""
        try:
            import email as email_lib  # noqa: PLC0415
            msg = email_lib.message_from_bytes(data)
            subject = msg.get("Subject", "")
            sender = msg.get("From", "")
            body_parts: list[str] = []

            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        payload = part.get_payload(decode=True)
                        if payload:
                            body_parts.append(payload.decode("utf-8", errors="replace"))
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body_parts.append(payload.decode("utf-8", errors="replace"))

            full_text = f"Subject: {subject}\nFrom: {sender}\n\n" + "\n".join(body_parts)
            metadata = {
                "filename": filename,
                "adapter": "email",
                "subject": subject,
                "from": sender,
            }
            return full_text, metadata
        except Exception as exc:
            logger.error("EmailAdapter failed for %s: %s", filename, exc)
            return "", {"filename": filename, "adapter": "email_stub", "error": str(exc)}


class TextAdapter:
    """Plain text and markdown files."""

    def can_handle(self, mime_type: str, filename: str) -> bool:
        return mime_type.startswith("text/") or filename.lower().endswith(
            (".txt", ".md", ".rst", ".log")
        )

    def extract(self, data: bytes, filename: str) -> tuple[str, dict]:
        text = data.decode("utf-8", errors="replace")
        return text, {
            "filename": filename,
            "adapter": "text",
            "char_count": len(text),
        }


# ── Registry and factory ──────────────────────────────────────────────────────

_ADAPTERS: list[DocumentAdapter] = [
    PDFAdapter(),
    DOCXAdapter(),
    CSVAdapter(),
    EmailAdapter(),
    TextAdapter(),
    ImageAdapter(),  # fallback — last so others match first
]


def get_adapter(mime_type: str, filename: str) -> DocumentAdapter:
    """Select the appropriate adapter for the given file.

    Args:
        mime_type: MIME type string.
        filename: Original filename.

    Returns:
        Matching DocumentAdapter instance.

    Raises:
        ValueError: No adapter found for the file type.
    """
    for adapter in _ADAPTERS:
        if adapter.can_handle(mime_type, filename):
            return adapter
    raise ValueError(f"No document adapter available for mime_type='{mime_type}', filename='{filename}'")
