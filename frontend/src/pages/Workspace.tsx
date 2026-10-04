import React, { useState } from 'react';
import mockClaimsData from '../mocks/claims.json';
import { Claim, Verdict } from '../api/types';
import { ClaimChip } from '../components/ClaimChip';

export const Workspace: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>(mockClaimsData as Claim[]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.claim_id || '');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const selectedClaim = claims.find((c) => c.claim_id === selectedClaimId) || claims[0];

  const counts = {
    TOTAL: claims.length,
    SUPPORTED: claims.filter((c) => c.verdict === 'SUPPORTED').length,
    CONTRADICTED: claims.filter((c) => c.verdict === 'CONTRADICTED').length,
    UNSUPPORTED: claims.filter((c) => c.verdict === 'UNSUPPORTED').length,
    NEEDS_REVIEW: claims.filter((c) => c.verdict === 'NEEDS_REVIEW').length,
  };

  const filteredClaims = activeFilter === 'ALL'
    ? claims
    : claims.filter((c) => c.verdict === activeFilter);

  const handleReviewAction = (action: 'confirm' | 'override' | 'needs_more_evidence', newVerdict?: Verdict) => {
    if (!selectedClaim) return;
    setClaims((prev) =>
      prev.map((c) => {
        if (c.claim_id === selectedClaim.claim_id) {
          return {
            ...c,
            review_status: action === 'confirm' ? 'confirmed' : action === 'override' ? 'overridden' : 'pending',
            verdict: newVerdict || c.verdict,
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b0f19] text-slate-100">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center font-black text-sm tracking-wider shadow">
            TR
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">TRACE</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">v0.1.0-scaffold</span>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
              activeFilter === 'ALL' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            All ({counts.TOTAL})
          </button>
          <button
            onClick={() => setActiveFilter('SUPPORTED')}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
              activeFilter === 'SUPPORTED' ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-slate-800/60 border-slate-700 text-emerald-400'
            }`}
          >
            Supported ({counts.SUPPORTED})
          </button>
          <button
            onClick={() => setActiveFilter('CONTRADICTED')}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
              activeFilter === 'CONTRADICTED' ? 'bg-rose-950 border-rose-500 text-rose-300' : 'bg-slate-800/60 border-slate-700 text-rose-400'
            }`}
          >
            Contradicted ({counts.CONTRADICTED})
          </button>
          <button
            onClick={() => setActiveFilter('UNSUPPORTED')}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
              activeFilter === 'UNSUPPORTED' ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-slate-800/60 border-slate-700 text-amber-400'
            }`}
          >
            Unsupported ({counts.UNSUPPORTED})
          </button>
          <button
            onClick={() => setActiveFilter('NEEDS_REVIEW')}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
              activeFilter === 'NEEDS_REVIEW' ? 'bg-purple-950 border-purple-500 text-purple-300' : 'bg-slate-800/60 border-slate-700 text-purple-400'
            }`}
          >
            Review ({counts.NEEDS_REVIEW})
          </button>
        </div>

        <div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            API Docs
          </a>
        </div>
      </header>

      {/* Main Workspace: 2-Panel UI */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Claims List */}
        <section className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-900/30">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Verified Claims ({filteredClaims.length})
            </h2>
            <span className="text-xs text-slate-500">Click a claim to inspect evidence</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredClaims.map((claim) => (
              <ClaimChip
                key={claim.claim_id}
                claim={claim}
                isSelected={claim.claim_id === selectedClaim?.claim_id}
                onClick={() => setSelectedClaimId(claim.claim_id)}
              />
            ))}
          </div>
        </section>

        {/* Right Panel: Source Evidence & Review Inspector */}
        <section className="w-1/2 flex flex-col bg-[#0d1322] overflow-y-auto p-6">
          {selectedClaim ? (
            <div className="space-y-6 max-w-2xl">
              <div>
                <span className="text-xs uppercase font-mono text-slate-400 tracking-wider">
                  Inspecting Claim #{selectedClaim.claim_id}
                </span>
                <h3 className="text-lg font-semibold text-slate-100 mt-1">
                  "{selectedClaim.claim_text}"
                </h3>
              </div>

              {/* Verdict Summary Card */}
              <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Verdict:</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-700 text-slate-200">
                      {selectedClaim.verdict}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Rule ID: <code className="text-indigo-300">{selectedClaim.rule_id}</code>
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  <span className="font-semibold text-slate-400">Reason: </span>
                  {selectedClaim.reason}
                </p>
                <div className="mt-2 text-xs text-slate-500">
                  Confidence Score: {(selectedClaim.confidence * 100).toFixed(1)}% (Calibrated)
                </div>
              </div>

              {/* Evidence Passages */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Document Evidence Passages ({selectedClaim.evidence.length})
                </h4>
                {selectedClaim.evidence.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center text-slate-400 text-sm">
                    No matching passages found in the source documents.
                  </div>
                ) : (
                  selectedClaim.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-slate-700/80 bg-slate-800/60 mb-3"
                    >
                      <div className="flex items-center justify-between text-xs text-indigo-300 mb-2">
                        <span>Doc: {ev.doc_id} • Page {ev.page}</span>
                        <span className="font-mono text-slate-400">
                          BBox: [{ev.bbox.map((b) => Math.round(b)).join(', ')}]
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 font-serif leading-relaxed bg-slate-950/40 p-3 rounded border border-slate-800">
                        "{ev.passage_text}"
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Responsible Design: Human Review Actions */}
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/80">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Human In The Loop
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Current Status: <span className="font-bold capitalize text-white">{selectedClaim.review_status}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewAction('confirm')}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                  >
                    Confirm Verdict
                  </button>
                  <button
                    onClick={() => handleReviewAction('override', 'CONTRADICTED')}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
                  >
                    Override Contradicted
                  </button>
                  <button
                    onClick={() => handleReviewAction('needs_more_evidence')}
                    className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium"
                  >
                    Flag For Review
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Select a claim on the left panel to inspect evidence.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
