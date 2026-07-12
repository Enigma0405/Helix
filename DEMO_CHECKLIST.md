# Helix Final Demo Checklist

Use this checklist immediately before recording your video or presenting live to the judges.

## Infrastructure
- [ ] Docker Compose is running (`docker-compose up -d`)
- [ ] Backend is healthy (`http://localhost:8000/api/health` returns 200)
- [ ] Frontend is reachable (`http://localhost:3000` or `http://localhost:80`)
- [ ] Fireworks AI API key is correctly set in `.env`
- [ ] MinIO storage is active and accessible

## Application Flow
- [ ] **Landing Page:** Logo visible, tagline accurate ("Evidence before AI. Always.").
- [ ] **Login:** Click through mock login succeeds.
- [ ] **Mission Control:** Signals load dynamically. Queue populates.
- [ ] **Investigation Workspace:** Clicking a case opens the 3-column layout.
- [ ] **Intelligent Tracing (Right Panel):** Verifies that real data (e.g., Sarah Chen, FAC-BOS-01) populates in the Context graph.
- [ ] **Evidence Upload (Left Panel):** Clicking upload successfully mocks the document ingestion.
- [ ] **Run Assessment (Center Panel):** AI triggers successfully. Facts and Gaps render.
- [ ] **CAPA Workflow:** Auto-generates the 3-step strategy (Root Cause, Containment, Prevention).
- [ ] **Closure:** Approving the CAPA successfully updates the status to closed.
- [ ] **Detail Drawer:** Clicking an SOP, Batch, or Personnel tag successfully opens the right-hand slide-out drawer.

## Submission Materials
- [ ] GitHub Repository is Public.
- [ ] `README.md` is updated and polished.
- [ ] Pitch Deck (Slides) exported to PDF.
- [ ] Demo Video uploaded to YouTube/Vimeo (Audio clear, 3-5 minutes).
- [ ] LabLab.ai submission form fully populated from `SUBMISSION.md`.
