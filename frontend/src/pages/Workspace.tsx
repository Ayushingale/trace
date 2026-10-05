import React, { useState } from 'react';
import mockClaimsData from '../mocks/claims.json';
import { Claim, Verdict, ReviewStatus } from '../api/types';
import { ClaimChip } from '../components/ClaimChip';
import { AnnotatedText } from '../components/AnnotatedText';
import { EvidenceCard } from '../components/EvidenceCard';
import { PdfViewer } from '../components/PdfViewer';
import { AskPanel } from '../components/AskPanel';
import { UploadPanel } from '../components/UploadPanel';
import { ReviewQueue } from '../components/ReviewQueue';
import { SummaryBar } from '../components/SummaryBar';
import { Report } from './Report';
import {
  ShieldCheck,
  Search,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';

const DEFAULT_AI_TEXT =
  'The contract term is fixed for a period of 24 months. Payment is due within 30 days of invoice receipt. The supplier holds ISO 27001 certification across all global data centers. Either party may terminate without cause by giving 60 days written notice. Liability for consequential damages is uncapped under gross negligence.';

export const Workspace: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>(mockClaimsData as Claim[]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.claim_id || '');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<'studio' | 'pdf' | 'ask' | 'report'>('studio');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [sourceText, setSourceText] = useState<string>(DEFAULT_AI_TEXT);
  const [activeDocument, setActiveDocument] = useState<string>('master_agreement.pdf');
  const [selectedDocPage, setSelectedDocPage] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const selectedClaim = claims.find((c) => c.claim_id === selectedClaimId) || claims[0];

  // Update selected doc page when selected claim changes
  React.useEffect(() => {
    if (selectedClaim && selectedClaim.evidence.length > 0) {
      setSelectedDocPage(selectedClaim.evidence[0].page);
    }
  }, [selectedClaimId]);

  // Filtered claims by verdict and text search
  const filteredClaims = claims.filter((claim) => {
    const matchesVerdict = activeFilter === 'ALL' || claim.verdict === activeFilter;
    const matchesSearch =
      searchFilter.trim() === '' ||
      claim.claim_text.toLowerCase().includes(searchFilter.toLowerCase()) ||
      claim.claim_type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      claim.rule_id.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesVerdict && matchesSearch;
  });

  // Human review handler
  const handleReviewAction = (
    action: 'confirm' | 'override' | 'needs_more_evidence',
    newVerdict?: Verdict,
    notes?: string
  ) => {
    if (!selectedClaim) return;
    const updatedStatus: ReviewStatus =
      action === 'confirm' ? 'confirmed' : action === 'override' ? 'overridden' : 'pending';

    setClaims((prev) =>
      prev.map((c) => {
        if (c.claim_id === selectedClaim.claim_id) {
          return {
            ...c,
            review_status: updatedStatus,
            verdict: newVerdict || c.verdict,
            reason: notes ? `${c.reason} [Auditor Note: ${notes}]` : c.reason,
          };
        }
        return c;
      })
    );
  };

  // Preset selection handler
  const handleStartVerification = (
    files: File[],
    text: string,
    samplePresetKey?: string
  ) => {
    setSourceText(text);
    if (samplePresetKey === 'clinical') {
      setActiveDocument('clinical_protocol_phase3.pdf');
      setClaims([
        {
          claim_id: 'c_med_01',
          claim_text: 'The primary endpoint was met with a 42% reduction in progression risk (p < 0.001).',
          char_start: 0,
          char_end: 80,
          claim_type: 'numeric',
          verdict: 'SUPPORTED',
          confidence: 0.98,
          reason: 'Table 3.4 confirms hazard ratio 0.58 corresponds to 42% relative risk reduction (p=0.0004).',
          rule_id: 'num.exact_match',
          evidence: [
            {
              doc_id: 'clinical_protocol_phase3.pdf',
              page: 4,
              bbox: [80.0, 150.0, 500.0, 200.0],
              passage_text: 'Table 3.4 Primary Endpoint: Progression-Free Survival HR 0.58 (95% CI 0.44-0.76, p < 0.001).',
            },
          ],
          review_status: 'none',
        },
        {
          claim_id: 'c_med_02',
          claim_text: 'Maximum tolerated dosage was determined to be 150mg twice daily with zero reported Grade 4 toxicities.',
          char_start: 81,
          char_end: 184,
          claim_type: 'numeric',
          verdict: 'CONTRADICTED',
          confidence: 0.94,
          reason: 'Source documents reported 2 patients with Grade 4 neutropenia at 150mg BID cohort.',
          rule_id: 'num.value_mismatch',
          evidence: [
            {
              doc_id: 'clinical_protocol_phase3.pdf',
              page: 6,
              bbox: [80.0, 280.0, 500.0, 320.0],
              passage_text: 'Safety cohort at 150mg BID recorded two (2) Grade 4 neutropenic events necessitating dose delay.',
            },
          ],
          review_status: 'none',
        },
        {
          claim_id: 'c_med_03',
          claim_text: 'All patients demonstrated sustained antibody titers through 12 months of follow-up.',
          char_start: 185,
          char_end: 268,
          claim_type: 'general',
          verdict: 'UNSUPPORTED',
          confidence: 0.89,
          reason: '12-month serology assays are ongoing; no conclusive antibody durability data in provided filings.',
          rule_id: 'ent.missing_corroboration',
          evidence: [],
          review_status: 'none',
        },
      ]);
      setSelectedClaimId('c_med_01');
    } else if (samplePresetKey === 'financial') {
      setActiveDocument('sec_10k_filing_2025.pdf');
      setClaims([
        {
          claim_id: 'c_fin_01',
          claim_text: 'Total consolidated GAAP revenue reached $4.2 billion, representing an 18% year-over-year increase.',
          char_start: 0,
          char_end: 104,
          claim_type: 'numeric',
          verdict: 'SUPPORTED',
          confidence: 0.97,
          reason: 'Consolidated Income Statement records fiscal revenue of $4,215M vs $3,572M prior year (+18.0%).',
          rule_id: 'num.exact_match',
          evidence: [
            {
              doc_id: 'sec_10k_filing_2025.pdf',
              page: 2,
              bbox: [72.0, 180.0, 520.0, 220.0],
              passage_text: 'Total net revenues for fiscal 2025 were $4,215 million, an increase of 18% from $3,572 million.',
            },
          ],
          review_status: 'none',
        },
        {
          claim_id: 'c_fin_02',
          claim_text: 'Operating margin expanded by 340 basis points to 28.5%.',
          char_start: 105,
          char_end: 160,
          claim_type: 'numeric',
          verdict: 'CONTRADICTED',
          confidence: 0.91,
          reason: 'GAAP operating margin expanded by 240 basis points (to 27.5%), not 340 basis points.',
          rule_id: 'num.value_mismatch',
          evidence: [
            {
              doc_id: 'sec_10k_filing_2025.pdf',
              page: 3,
              bbox: [72.0, 310.0, 520.0, 340.0],
              passage_text: 'Operating margin was 27.5%, expanding 240 basis points compared to 25.1% in the prior year.',
            },
          ],
          review_status: 'none',
        },
      ]);
      setSelectedClaimId('c_fin_01');
    } else {
      setActiveDocument('master_agreement.pdf');
      setClaims(mockClaimsData as Claim[]);
      setSelectedClaimId(mockClaimsData[0].claim_id);
    }
  };

  // Jump to document viewer
  const handleViewInDocument = (docId: string, page: number) => {
    setActiveDocument(docId);
    setSelectedDocPage(page);
    setActiveView('pdf');
  };

  return (
    <div className="flex flex-col h-screen bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-indigo-950/60">
            TR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">TRACE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-semibold">
                v0.1.0 • Neuro-Symbolic
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Claim-Level Factuality Verifier & Grounding Engine
            </p>
          </div>
        </div>

        {/* Global info / actions */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Calibrated Combiner Online</span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition"
          >
            <span>FastAPI Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Summary KPI Bar */}
      <SummaryBar
        claims={claims}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Body Content Switcher */}
      <main className="flex-1 overflow-hidden flex">
        {activeView === 'studio' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Annotated Text & Claims Queue */}
            <section className="w-1/2 border-r border-slate-800/80 flex flex-col bg-slate-900/30 overflow-hidden">
              {/* Upper Section: Interactive Annotated AI Text */}
              <div className="h-2/5 p-4 border-b border-slate-800/80 flex flex-col">
                <AnnotatedText
                  text={sourceText}
                  claims={claims}
                  selectedClaimId={selectedClaimId}
                  onSelectClaim={(id) => setSelectedClaimId(id)}
                  onTextChange={(newText) => setSourceText(newText)}
                />
              </div>

              {/* Lower Section: Claims List with Search & Filter */}
              <div className="h-3/5 flex flex-col overflow-hidden">
                <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Atomic Claims ({filteredClaims.length})
                    </h2>
                    {activeFilter !== 'ALL' && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                        {activeFilter}
                      </span>
                    )}
                  </div>

                  {/* Search within claims */}
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search claims..."
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Claims Scroll Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredClaims.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
                      <Info className="w-6 h-6 mb-2 text-slate-600" />
                      <span>No claims matching active filter criteria.</span>
                    </div>
                  ) : (
                    filteredClaims.map((claim) => (
                      <ClaimChip
                        key={claim.claim_id}
                        claim={claim}
                        isSelected={claim.claim_id === selectedClaim?.claim_id}
                        onClick={() => setSelectedClaimId(claim.claim_id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Right Panel: Source Evidence & Review Inspector */}
            <section className="w-1/2 flex flex-col bg-[#090d16] overflow-y-auto p-6">
              {selectedClaim ? (
                <div className="space-y-6 max-w-2xl mx-auto w-full animate-fadeIn">
                  {/* Selected Claim Title Header */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] uppercase font-mono text-indigo-400 tracking-wider font-semibold">
                        Inspecting Claim #{selectedClaim.claim_id}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Span: [{selectedClaim.char_start} : {selectedClaim.char_end}]
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">
                      "{selectedClaim.claim_text}"
                    </h3>
                  </div>

                  {/* Verdict Details & Confidence Card */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-md">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Verdict:
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                            selectedClaim.verdict === 'SUPPORTED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : selectedClaim.verdict === 'CONTRADICTED'
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : selectedClaim.verdict === 'UNSUPPORTED'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-purple-950 text-purple-300 border-purple-700'
                          }`}
                        >
                          {selectedClaim.verdict}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Rule Trigger:</span>
                        <code className="text-indigo-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {selectedClaim.rule_id}
                        </code>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      <span className="font-semibold text-slate-400">Verification Reasoning: </span>
                      {selectedClaim.reason}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Calibrated Confidence Score</span>
                        <span className="text-white font-bold">
                          {(selectedClaim.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${selectedClaim.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Evidence Passages */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Document Grounding Citations ({selectedClaim.evidence.length})
                      </h4>
                      {selectedClaim.evidence.length > 0 && (
                        <button
                          onClick={() =>
                            handleViewInDocument(
                              selectedClaim.evidence[0].doc_id,
                              selectedClaim.evidence[0].page
                            )
                          }
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
                        >
                          <span>Open in PDF Inspector</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {selectedClaim.evidence.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-slate-400 text-xs space-y-1">
                        <p className="font-semibold text-slate-300">
                          No corroborating evidence located in document index.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          This claim is categorized as UNSUPPORTED (potential AI hallucination).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedClaim.evidence.map((ev, idx) => (
                          <EvidenceCard
                            key={idx}
                            evidence={ev}
                            index={idx}
                            onViewInDoc={handleViewInDocument}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Human In The Loop Review Station */}
                  <ReviewQueue
                    claim={selectedClaim}
                    onReviewAction={handleReviewAction}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Select a claim on the left to inspect evidence.
                </div>
              )}
            </section>
          </div>
        )}

        {/* PDF & Document View */}
        {activeView === 'pdf' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Claim to Locate
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {claims.map((claim) => (
                  <div
                    key={claim.claim_id}
                    onClick={() => {
                      setSelectedClaimId(claim.claim_id);
                      if (claim.evidence.length > 0) {
                        setSelectedDocPage(claim.evidence[0].page);
                      }
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                      claim.claim_id === selectedClaim?.claim_id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-indigo-400">{claim.claim_id}</span>
                      <span className="text-[10px] font-bold uppercase">{claim.verdict}</span>
                    </div>
                    <p className="line-clamp-2 italic font-serif">"{claim.claim_text}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-4">
              <PdfViewer
                currentDocId={activeDocument}
                activeEvidence={selectedClaim?.evidence}
                selectedPage={selectedDocPage}
                highlightBbox={
                  selectedClaim?.evidence.length > 0
                    ? (selectedClaim.evidence[0].bbox as number[])
                    : undefined
                }
                onPageChange={(p) => setSelectedDocPage(p)}
              />
            </div>
          </div>
        )}

        {/* Ask TRACE Q&A View */}
        {activeView === 'ask' && (
          <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
            <AskPanel
              jobId="job_active_01"
              onSelectClaim={(claim) => {
                // If claim is in current list or can be inspected
                setSelectedClaimId(claim.claim_id);
                setActiveView('studio');
              }}
            />
          </div>
        )}

        {/* Audit Report View */}
        {activeView === 'report' && (
          <div className="flex-1 overflow-y-auto">
            <Report
              claims={claims}
              docTitle={activeDocument}
              onBackToStudio={() => setActiveView('studio')}
            />
          </div>
        )}
      </main>

      {/* Upload & Preset Modal */}
      <UploadPanel
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onStartVerification={handleStartVerification}
      />
    </div>
  );
};

export default Workspace;
