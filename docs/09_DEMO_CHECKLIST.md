# Hackathon Demo Checklist

Prior to recording the demo video or presenting to the judges, verify all items on this checklist are fully operational.

## 1. Environment Readiness
- [ ] Backend is running (`docker-compose up` or Render deployment).
- [ ] Frontend is running (`npm run dev` or Vercel deployment).
- [ ] Database is seeded with the Aetheris BioPharma dataset.
- [ ] Fireworks AI API key is valid and funded.

## 2. Authentication Flow
- [ ] Navigate to `/login`.
- [ ] Verify the default credentials (`sarah.chen@apex.com` / `password123`) populate.
- [ ] Verify the password text is visible (black text).
- [ ] Click "Sign In" and ensure successful redirection to `/app`.

## 3. Mission Control (Dashboard)
- [ ] Verify the dynamic greeting says "Good morning/afternoon/evening" correctly based on local time.
- [ ] Verify the Organization Memory panel shows "Syncing" or "Active".
- [ ] Verify the Incoming Events list populates with the mocked Operational Signals.

## 4. Evidence Ingestion & Assessment
- [ ] Click on "Lot #LBL-3948 Label Mix-up" to enter the Investigation Detail Page.
- [ ] Drag and drop any dummy file (e.g., PDF/CSV) into the "Drag & drop evidence files" zone.
- [ ] Observe the mock upload progress bar complete.
- [ ] **CRITICAL:** Do NOT click anything. Wait 0.8 seconds and verify the AI Assessment automatically triggers and renders the "Evidence-Backed Reasoning" block.

## 5. UI Interactivity & Traceability
- [ ] Click the "Fact", "Reasoning", and "Gap" filter chips. Verify the text below filters accordingly.
- [ ] Click "View Master Record" in the top right. Verify the Traceability Drawer slides out from the right with the immutable ledger details.
- [ ] Click the items in the "Intelligent Tracing" sidebar (e.g., SOP-STER-014). Verify the drawer opens with the specific entity metadata.

## 6. CAPA Generation
- [ ] Wait 1.5 seconds after the assessment finishes. Verify the CAPA automatically drafts.
- [ ] Review the structured JSON output rendered beautifully in the CAPA execution block.
- [ ] Click "Approve & Close Investigation". Verify the success toast appears.

## 7. Submission Assets
- [ ] 02_DEMO_SCRIPT.md is printed and rehearsed.
- [ ] 03_SUBMISSION.md text is pasted into the LabLab submission portal.
- [ ] 04_PITCH_DECK.md is exported to PDF/Slides.
- [ ] GitHub repository is set to PUBLIC.
