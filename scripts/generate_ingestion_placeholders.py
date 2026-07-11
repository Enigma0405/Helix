import os

placeholders = {
    "discovery.py": '"""Scans Organization Seed for new or updated files to ingest. Idempotent check."""',
    "parser.py": '"""Extracts raw text/structure from various formats (PDF, docx). Only invokes AI if confidence is low."""',
    "classifier.py": '"""Classifies document type (SOP, Policy, Investigation, etc.) based on parsed content."""',
    "validator.py": '"""Validates extracted fields against business rules. No hallucination allowed."""',
    "mapper.py": '"""Maps validated data to intermediate domain models."""',
    "normalizer.py": '"""Normalizes mapped data into the final Canonical JSON structure."""',
    "verifier.py": '"""Performs final checks (checksums, mandatory fields) before persistence."""',
    "persistence.py": '"""Stores Canonical JSON in Organization Memory and generates knowledge_manifest.json."""',
    "logging.py": '"""Structured logging specific to the ingestion pipeline."""',
}

def main():
    dir_path = "backend/src/ingestion"
    os.makedirs(dir_path, exist_ok=True)
    for filename, content in placeholders.items():
        with open(os.path.join(dir_path, filename), "w", encoding="utf-8") as f:
            f.write(content + "\n")

if __name__ == "__main__":
    main()
