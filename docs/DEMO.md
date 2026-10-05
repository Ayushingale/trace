# TRACE: 3-Minute Live Demo Script

**Speaker Persona**: Presenter / Product Engineer  
**Target Audience**: Hackathon Judges, Legal/Compliance Evaluators, Technical Architects  
**Goal**: Demonstrate that TRACE turns ungrounded AI summaries into an interactive, visual proof of truth in under 3 minutes.

---

## Act 1: The Problem & The Setup (0:00 - 0:45)

### Screen: TRACE Dark-Themed Three-Column Workspace
- **Action**: Show empty workspace or pre-loaded MSA document.
- **Narration**:
  > *"Every company is deploying LLMs to summarize complex contracts, 10-Ks, and compliance policies. But here is the dirty secret: nobody completely trusts them. A paralegal or analyst spends 30 minutes manually re-reading the PDF because catching a single hallucinated word—like 'calendar days' instead of 'business days'—can save a company millions in liability."*
- **Action**: Switch to the "Verify" tab on the Left Panel.
- **Narration**:
  > *"Meet TRACE: the Source Trace Visualizer. TRACE doesn't just grade an answer—it gives judges and analysts an interactive, verifiable graph showing exactly where every claim comes from."*

---

## Act 2: Claim Ingestion & The Live 5-Layer Graph (0:45 - 1:45)

### Screen: Left Panel + Center Graph
- **Action**: Click **"Load Mock Benchmark"** or paste sample text and click **"Verify Claims"**.
- **Visual**:
  - Left panel streams claims one by one.
  - Claims first appear in a subtle grey "checking" pulse, then resolve into annotated spans with numbered badges `[1]`, `[2]`, `[3]`, `[4]`, `[5]`.
  - In the Center Graph, nodes and animated dashed edges pop in layer by layer!
- **Narration**:
  > *"Notice what's happening live. On the left, our text is segmented into atomic claims. As our verification engine runs, our center canvas automatically compiles a 5-layer Source Trace Graph.*
  > - *Layer 1: The source PDF (`master_agreement.pdf`).*
  > - *Layer 2: The retrieved evidence passages.*
  > - *Layer 3: The decision engines—from deterministic unit checkers to cross-encoder NLI and calibrated combiners.*
  > - *Layer 4: Each claim, color-coded by verdict.*
  > - *Layer 5: The root trust summary.*
  > *Judges can literally see the proof tree grow in real time."*

---

## Act 3: Interactive Lineage & PDF Bounding Box Highlight (1:45 - 2:25)

### Screen: Graph Interaction + Right Panel + PDF Drawer
- **Action**: Click claim badge `[2]` ("Payment is due within 30 days of invoice receipt").
- **Visual**:
  - The graph focuses and pans to Claim 2.
  - The upstream path (Document -> Passage 2 -> Deterministic Numeric Check -> Claim 2) illuminates in high-contrast cyan/red, while all unrelated nodes smoothly dim to 20% opacity.
  - The Right Panel automatically updates to show Claim 2 with its red CONTRADICTED pill and rule `num.unit_mismatch`.
- **Narration**:
  > *"Look what happens when I click Claim 2. The entire graph highlights its upstream lineage and dims everything else. Notice that our deterministic checker flagged this as CONTRADICTED. Why? Because the AI claimed '30 days', but the actual contract specifies '30 business days'."*
- **Action**: Click the passage node or click **"Open in document"** on the right card.
- **Visual**:
  - The PDF Drawer slides open smoothly on page 3.
  - The exact clause is highlighted with a bounding box and a brief pulse animation.
- **Narration**:
  > *"One click opens the document directly to Page 3 with the exact bounding box highlighted. No more manual search. Immediate, visual, audit-grade verification."*

---

## Act 4: Human-in-the-Loop & Export (2:25 - 3:00)

### Screen: Right Panel Review & Download
- **Action**: Click claim `[5]` ("Liability for consequential damages is uncapped...").
- **Visual**:
  - Verdict is purple `NEEDS_REVIEW` with combiner confidence 0.58.
  - Three action buttons appear: **Confirm**, **Override**, **Need More Evidence**.
  - Click **"Override"** -> select **SUPPORTED** or add notes -> a green "Reviewed" badge appears.
- **Narration**:
  > *"For complex, ambiguous legal clauses where our combiner abstains, TRACE puts the human in control. A reviewer can confirm or override the verdict with a single click, recording an immutable review audit trail."*
- **Action**: Click the **Download (PNG / JSON)** button in the top bar.
- **Narration**:
  > *"Finally, compliance teams can export the full lineage as a PNG graph or audit JSON for regulatory review. With TRACE, AI moves from an ungrounded black box to an explainable, verifiable partner. Thank you!"*
