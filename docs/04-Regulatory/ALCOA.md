# ALCOA+ Principles (Data Integrity)

## Why Helix Cares
ALCOA+ is the global standard for data integrity in regulated life sciences. Every piece of evidence ingested by Helix (logs, records, PDFs) must be evaluated to ensure it has not been tampered with and accurately reflects the event.

## How AI Uses It
The Evidence Agent parses incoming files and metadata against ALCOA+ criteria:
- **Attributable**: Who created the record? (Helix checks audit trails).
- **Legible**: Can the data be read? (Helix OCRs documents and flags unreadable sections).
- **Contemporaneous**: Was it recorded at the time of the event? (Helix compares log timestamps vs database entry times).
- **Original**: Is this the raw data or a copy? 
- **Accurate**: Does the data match expected ranges?

## How it Affects Investigations
If a piece of evidence violates ALCOA+ (e.g., a manual entry was made 3 days after the batch was completed), Helix automatically lowers the confidence score of any hypothesis relying on that evidence and flags a secondary "Data Integrity Violation" risk for the QA Reviewer.
