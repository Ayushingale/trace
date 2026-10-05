import React, { useState } from 'react';
import { Claim, Verdict } from '../api/types';
import {
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  History,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ReviewQueueProps {
  claim: Claim;
  onReviewAction: (
    action: 'confirm' | 'override' | 'needs_more_evidence',
    newVerdict?: Verdict,
    notes?: string
  ) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ claim, onReviewAction }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedVerdictOverride, setSelectedVerdictOverride] = useState<Verdict>(claim.verdict);
  const [submitted, setSubmitted] = useState(false);

  const handleConfirm = () => {
    onReviewAction('confirm', claim.verdict, reviewNotes);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const handleOverride = (verdict: Verdict) => {
    setSelectedVerdictOverride(verdict);
    onReviewAction('override', verdict, reviewNotes);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const handleFlagMoreEvidence = () => {
    onReviewAction('needs_more_evidence', 'NEEDS_REVIEW', reviewNotes);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur p-5 shadow-lg relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200">
              Human-in-the-Loop Audit Station
            </h4>
            <p className="text-[11px] text-purple-300/70">
              Responsible AI Governance • Calibrated Combiner Abstention
            </p>
          </div>
        </div>

        {/* Current status pill */}
        <span
          className={`text-[11px] font-mono px-2.5 py-1 rounded-full uppercase font-bold border ${
            claim.review_status === 'confirmed'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
              : claim.review_status === 'overridden'
              ? 'bg-rose-950 text-rose-300 border-rose-700'
              : 'bg-purple-900/60 text-purple-300 border-purple-600/50 animate-pulse'
          }`}
        >
          Status: {claim.review_status}
        </span>
      </div>

      {/* Abstention Explanation */}
      <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3.5 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1.5 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Combiner Decision Heuristic:</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {claim.reason}
        </p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Confidence: {(claim.confidence * 100).toFixed(1)}% (Threshold: 65.0%)</span>
          <span>Rule: {claim.rule_id}</span>
        </div>
      </div>

      {/* Reviewer Action Buttons */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleConfirm}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm AI Verdict</span>
          </button>

          <button
            onClick={() => handleOverride('CONTRADICTED')}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Override Contradicted</span>
          </button>

          <button
            onClick={() => handleOverride('SUPPORTED')}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-semibold shadow-md transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Override Supported</span>
          </button>

          <button
            onClick={handleFlagMoreEvidence}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Request Additional Citations</span>
          </button>
        </div>

        {/* Auditor Notes Field */}
        <div className="pt-2">
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Auditor Justification & Notes:
          </label>
          <input
            type="text"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="e.g. Cross-referenced Clause 11.2 with local jurisdiction statutes..."
            className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {submitted && (
          <div className="p-2 rounded bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit action successfully recorded in verification ledger!</span>
          </div>
        )}
      </div>
    </div>
  );
};
