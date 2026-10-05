import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Check,
  Undo2,
  Search,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { useTraceStore } from '../store/useTraceStore';
import { Claim, Verdict, ReviewAction } from '../api/types';
import { getVerdictColor, getUpstreamPath } from '../graph/buildGraph';

export const RightPanel: React.FC = () => {
  const {
    claims,
    graph,
    selectedClaimId,
    selectedNodeId,
    selectClaim,
    selectNode,
    reviewClaim,
    openPdf,
  } = useTraceStore();

  const [expandedClaimIds, setExpandedClaimIds] = useState<Set<string>>(new Set(['c_001', 'c_002', 'c_005']));
  const [overrideModalClaimId, setOverrideModalClaimId] = useState<string | null>(null);

  const toggleExpand = (claimId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClaimIds((prev) => {
      const next = new Set(prev);
      if (next.has(claimId)) next.delete(claimId);
      else next.add(claimId);
      return next;
    });
  };

  // Compute dynamic panel title based on selection
  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId);
  const panelTitle = selectedNode
    ? selectedNode.data.nodeType === 'claim'
      ? `Claim [${selectedNode.data.claimIndex || 1}]`
      : selectedNode.data.label
    : 'Claims & Attribution';

  // Metrics for Summary Bar on top
  const total = claims.length;
  const supported = claims.filter((c) => c.verdict === 'SUPPORTED').length;
  const contradicted = claims.filter((c) => c.verdict === 'CONTRADICTED').length;
  const unsupported = claims.filter((c) => c.verdict === 'UNSUPPORTED').length;
  const needsReview = claims.filter((c) => c.verdict === 'NEEDS_REVIEW').length;
  const trustScore = total > 0 ? Math.round(((supported + needsReview * 0.4) / total) * 100) : 0;

  const getVerdictBadge = (verdict: Verdict) => {
    switch (verdict) {
      case 'SUPPORTED':
        return {
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
          label: 'Supported',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'CONTRADICTED':
        return {
          icon: <XCircle className="h-3 w-3 text-rose-400" />,
          label: 'Contradicted',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'UNSUPPORTED':
        return {
          icon: <AlertTriangle className="h-3 w-3 text-amber-400" />,
          label: 'Unsupported',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'NEEDS_REVIEW':
        return {
          icon: <HelpCircle className="h-3 w-3 text-purple-400" />,
          label: 'Needs Review',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0b101b] border-l border-slate-800/90 text-slate-200 select-none">
      {/* Top Header with dynamic title and close button */}
      <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#0e1422] p-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 truncate">
              {panelTitle}
            </h3>
            {selectedClaimId && (
              <span className="rounded bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.2 text-[9px] font-mono text-blue-300">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Click a claim to see its upstream sources in the trace graph
          </p>
        </div>

        {selectedNodeId && (
          <button
            onClick={() => selectNode(null)}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/80"
            title="Deselect Node"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Summary Bar on Top */}
      <div className="border-b border-slate-800/90 bg-slate-900/60 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Trust Score</span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400">{trustScore}%</span>
        </div>

        {/* Multi-segmented trust bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            style={{ width: `${(supported / Math.max(1, total)) * 100}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Supported: ${supported}`}
          />
          <div
            style={{ width: `${(needsReview / Math.max(1, total)) * 100}%` }}
            className="bg-purple-500 transition-all duration-300"
            title={`Needs Review: ${needsReview}`}
          />
          <div
            style={{ width: `${(unsupported / Math.max(1, total)) * 100}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Unsupported: ${unsupported}`}
          />
          <div
            style={{ width: `${(contradicted / Math.max(1, total)) * 100}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Contradicted: ${contradicted}`}
          />
        </div>

        {/* Verdict counts pill row */}
        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
          <div className="rounded bg-emerald-950/40 border border-emerald-500/30 px-1 py-0.5 text-emerald-300">
            {supported} Supp
          </div>
          <div className="rounded bg-rose-950/40 border border-rose-500/30 px-1 py-0.5 text-rose-300">
            {contradicted} Contra
          </div>
          <div className="rounded bg-amber-950/40 border border-amber-500/30 px-1 py-0.5 text-amber-300">
            {unsupported} Unsupp
          </div>
          <div className="rounded bg-purple-950/40 border border-purple-500/30 px-1 py-0.5 text-purple-300">
            {needsReview} Review
          </div>
        </div>
      </div>

      {/* Scrollable Claim Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {claims.map((claim, idx) => {
          const isSelected = selectedClaimId === claim.claim_id;
          const isExpanded = expandedClaimIds.has(claim.claim_id);
          const badge = getVerdictBadge(claim.verdict);
          const confidencePct = Math.round(claim.confidence * 100);

          // Compute upstream sources connected to this claim
          const upstream = getUpstreamPath(`claim_${claim.claim_id}`, graph.edges);
          const upstreamSourcesCount = Math.max(0, upstream.nodeIds.size - 1);

          return (
            <div
              key={claim.claim_id}
              onClick={() => selectClaim(claim.claim_id)}
              className={`group rounded-xl border-2 transition-all duration-200 cursor-pointer shadow-md bg-slate-900/80 ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/40 bg-slate-900 shadow-blue-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-3">
                {/* Header: Badge [N], ID, Verdict, Review Status */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 items-center justify-center rounded-full bg-blue-600 px-2 text-[10px] font-mono font-bold text-white shadow-sm">
                      [{idx + 1}]
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      {claim.claim_id}
                    </span>
                    {claim.review_status && claim.review_status !== 'none' && (
                      <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-400">
                        {claim.review_status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>

                {/* Claim Text */}
                <p className="text-xs font-medium text-slate-100 leading-relaxed select-text mb-2.5">
                  {claim.claim_text}
                </p>

                {/* Reason Explanation */}
                {claim.reason && (
                  <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2 text-[11px] text-slate-300 mb-2 leading-snug">
                    <span className="font-semibold text-slate-400 mr-1">Reason:</span>
                    {claim.reason}
                  </div>
                )}

                {/* Confidence Bar & Upstream Count */}
                <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-[10px]">
                  <div className="flex items-center justify-between font-mono text-slate-400">
                    <span>Confidence</span>
                    <span className="font-bold text-slate-200">{confidencePct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${confidencePct}%`,
                        backgroundColor: getVerdictColor(claim.verdict),
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="rounded bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                      {claim.rule_id}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-mono text-blue-400">
                      <Layers className="h-3 w-3" />
                      <span>Connected to: {upstreamSourcesCount} upstream sources</span>
                    </span>
                  </div>
                </div>

                {/* Purple / Needs Review Action Buttons (Confirm / Override / Need More Evidence) */}
                {claim.verdict === 'NEEDS_REVIEW' && (
                  <div className="mt-3 border-t border-purple-900/40 pt-2.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-purple-400 block mb-1.5">
                      Human Review Required
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reviewClaim(claim.claim_id, 'confirm');
                        }}
                        className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 py-1 text-[10px] font-medium text-emerald-300 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        <span>Confirm</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverrideModalClaimId(claim.claim_id);
                        }}
                        className="flex items-center justify-center gap-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 py-1 text-[10px] font-medium text-blue-300 transition-colors"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Override</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reviewClaim(claim.claim_id, 'needs_more_evidence');
                        }}
                        className="flex items-center justify-center gap-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 py-1 text-[10px] font-medium text-amber-300 transition-colors"
                      >
                        <span>Need Evid</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Expand / Collapse Button for Evidence */}
                {claim.evidence && claim.evidence.length > 0 && (
                  <button
                    onClick={(e) => toggleExpand(claim.claim_id, e)}
                    className="mt-2.5 flex w-full items-center justify-between rounded-lg bg-slate-950/40 hover:bg-slate-800/60 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span>{claim.evidence.length} Evidence Passage(s)</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {/* Expanded Quoted Evidence Passage */}
                {isExpanded && claim.evidence && claim.evidence.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-slate-800/60 pt-2">
                    {claim.evidence.map((ev, evIdx) => (
                      <div
                        key={evIdx}
                        className="rounded-lg bg-slate-950/80 border border-cyan-900/40 p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-cyan-400 font-semibold">
                            {ev.doc_id} • Page {ev.page}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPdf({
                                docId: ev.doc_id,
                                page: ev.page,
                                bbox: ev.bbox,
                                passageText: ev.passage_text,
                              });
                            }}
                            className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline underline-offset-2 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Open in document</span>
                          </button>
                        </div>
                        <p className="text-[11px] italic text-slate-300 leading-relaxed font-sans">
                          "{ev.passage_text}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Verdict Modal dialog */}
      {overrideModalClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-100">
              Override Verdict for {overrideModalClaimId}
            </h4>
            <p className="text-xs text-slate-400">
              Select the new verdict based on human domain assessment:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  reviewClaim(overrideModalClaimId, 'override', 'SUPPORTED');
                  setOverrideModalClaimId(null);
                }}
                className="rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/50 p-2 text-xs font-semibold text-emerald-200 transition-colors"
              >
                SUPPORTED
              </button>
              <button
                onClick={() => {
                  reviewClaim(overrideModalClaimId, 'override', 'CONTRADICTED');
                  setOverrideModalClaimId(null);
                }}
                className="rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 p-2 text-xs font-semibold text-rose-200 transition-colors"
              >
                CONTRADICTED
              </button>
            </div>
            <button
              onClick={() => setOverrideModalClaimId(null)}
              className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-1.5 text-xs text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
