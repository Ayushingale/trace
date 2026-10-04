import React from 'react';
import { Claim, Verdict } from '../api/types';

interface ClaimChipProps {
  claim: Claim;
  isSelected?: boolean;
  onClick?: () => void;
}

const VERDICT_STYLES: Record<Verdict, { badge: string; border: string; label: string }> = {
  SUPPORTED: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    border: 'border-l-emerald-500',
    label: 'SUPPORTED',
  },
  CONTRADICTED: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    border: 'border-l-rose-500',
    label: 'CONTRADICTED',
  },
  UNSUPPORTED: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'border-l-amber-500',
    label: 'UNSUPPORTED',
  },
  NEEDS_REVIEW: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    border: 'border-l-purple-500',
    label: 'NEEDS REVIEW',
  },
};

export const ClaimChip: React.FC<ClaimChipProps> = ({ claim, isSelected = false, onClick }) => {
  const verdictStyle = VERDICT_STYLES[claim.verdict] || VERDICT_STYLES.NEEDS_REVIEW;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-150 border-l-4 border bg-slate-800/80 hover:bg-slate-800 ${verdictStyle.border} ${
        isSelected ? 'ring-2 ring-blue-500 bg-slate-800' : 'border-slate-700/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${verdictStyle.badge}`}>
          {verdictStyle.label}
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="capitalize">{claim.claim_type}</span>
          <span>•</span>
          <span>{Math.round(claim.confidence * 100)}% conf</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-200 line-clamp-2 mb-2">
        "{claim.claim_text}"
      </p>
      <p className="text-xs text-slate-400 line-clamp-1 italic">
        {claim.reason}
      </p>
    </div>
  );
};
