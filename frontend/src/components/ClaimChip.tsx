import React from 'react';
import { Claim, Verdict } from '../api/types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldCheck, UserCheck } from 'lucide-react';

interface ClaimChipProps {
  claim: Claim;
  isSelected?: boolean;
  onClick?: () => void;
}

const VERDICT_CONFIG: Record<
  Verdict,
  {
    badge: string;
    text: string;
    border: string;
    activeBg: string;
    icon: React.ReactNode;
    label: string;
    dotColor: string;
  }
> = {
  SUPPORTED: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    text: 'text-emerald-400',
    border: 'border-l-emerald-500',
    activeBg: 'bg-emerald-950/20 border-emerald-500/50',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    label: 'SUPPORTED',
    dotColor: 'bg-emerald-400',
  },
  CONTRADICTED: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    text: 'text-rose-400',
    border: 'border-l-rose-500',
    activeBg: 'bg-rose-950/20 border-rose-500/50',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
    label: 'CONTRADICTED',
    dotColor: 'bg-rose-400',
  },
  UNSUPPORTED: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
    border: 'border-l-amber-500',
    activeBg: 'bg-amber-950/20 border-amber-500/50',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    label: 'UNSUPPORTED',
    dotColor: 'bg-amber-400',
  },
  NEEDS_REVIEW: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    text: 'text-purple-400',
    border: 'border-l-purple-500',
    activeBg: 'bg-purple-950/20 border-purple-500/50',
    icon: <HelpCircle className="w-3.5 h-3.5 text-purple-400" />,
    label: 'NEEDS REVIEW',
    dotColor: 'bg-purple-400',
  },
};

const CLAIM_TYPE_COLORS: Record<string, string> = {
  numeric: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
  duration: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60',
  date: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
  modal: 'text-pink-400 bg-pink-950/60 border-pink-800/60',
  negation: 'text-orange-400 bg-orange-950/60 border-orange-800/60',
  entity: 'text-teal-400 bg-teal-950/60 border-teal-800/60',
  general: 'text-slate-400 bg-slate-800/60 border-slate-700/60',
};

export const ClaimChip: React.FC<ClaimChipProps> = ({ claim, isSelected = false, onClick }) => {
  const config = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG.NEEDS_REVIEW;
  const typeStyle = CLAIM_TYPE_COLORS[claim.claim_type] || CLAIM_TYPE_COLORS.general;
  const confPercent = Math.round(claim.confidence * 100);

  return (
    <div
      onClick={onClick}
      className={`group relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border-l-[3px] border ${
        config.border
      } ${
        isSelected
          ? `${config.activeBg} ring-1 ring-indigo-500/50 shadow-lg shadow-black/40`
          : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Verdict Badge */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${config.badge}`}
          >
            {config.icon}
            {config.label}
          </span>

          {/* Claim Type Badge */}
          <span
            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${typeStyle}`}
          >
            {claim.claim_type}
          </span>
        </div>

        {/* Confidence & Review Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {claim.review_status === 'confirmed' && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              <UserCheck className="w-3 h-3" /> Audited
            </span>
          )}
          {claim.review_status === 'overridden' && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
              <ShieldCheck className="w-3 h-3" /> Overridden
            </span>
          )}
          <span className="font-mono text-slate-400 font-medium">{confPercent}%</span>
        </div>
      </div>

      {/* Claim Sentence Text */}
      <p className="text-sm font-normal text-slate-100 leading-snug mb-2 group-hover:text-white transition">
        "{claim.claim_text}"
      </p>

      {/* Footer Reason & Rule */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <p className="line-clamp-1 text-[11px] text-slate-400 italic pr-2">
          {claim.reason}
        </p>
        <code className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-300 transition shrink-0">
          {claim.rule_id}
        </code>
      </div>

      {/* Confidence progress bar */}
      <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            claim.verdict === 'SUPPORTED'
              ? 'bg-emerald-500'
              : claim.verdict === 'CONTRADICTED'
              ? 'bg-rose-500'
              : claim.verdict === 'UNSUPPORTED'
              ? 'bg-amber-500'
              : 'bg-purple-500'
          }`}
          style={{ width: `${confPercent}%` }}
        />
      </div>
    </div>
  );
};
