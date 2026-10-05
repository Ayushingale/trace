import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import { GraphNodeData } from '../buildGraph';
import { useTraceStore } from '../../store/useTraceStore';
import { Verdict } from '../../api/types';

export const ClaimNode: React.FC<{ data: GraphNodeData; id: string }> = ({ data, id }) => {
  const { upstreamNodeIds, selectedNodeId, selectClaim } = useTraceStore();
  const isSelected = selectedNodeId === id;
  const isHighlighted = upstreamNodeIds.has(id);
  const isDimmed = upstreamNodeIds.size > 0 && !isHighlighted;

  const verdict = data.verdict || 'UNSUPPORTED';
  const confidencePct = Math.round((data.confidence || 0) * 100);

  const getVerdictStyles = (v: Verdict) => {
    switch (v) {
      case 'SUPPORTED':
        return {
          border: 'border-emerald-500',
          bg: 'bg-gradient-to-b from-emerald-950/40 to-slate-900/90',
          activeBg: 'bg-emerald-950/80',
          shadow: 'shadow-emerald-500/20',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
          handleBg: '#10b981',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />,
        };
      case 'CONTRADICTED':
        return {
          border: 'border-rose-500',
          bg: 'bg-gradient-to-b from-rose-950/40 to-slate-900/90',
          activeBg: 'bg-rose-950/80',
          shadow: 'shadow-rose-500/20',
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
          handleBg: '#f43f5e',
          icon: <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />,
        };
      case 'UNSUPPORTED':
        return {
          border: 'border-amber-500',
          bg: 'bg-gradient-to-b from-amber-950/40 to-slate-900/90',
          activeBg: 'bg-amber-950/80',
          shadow: 'shadow-amber-500/20',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          handleBg: '#f59e0b',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />,
        };
      case 'NEEDS_REVIEW':
        return {
          border: 'border-purple-500',
          bg: 'bg-gradient-to-b from-purple-950/40 to-slate-900/90',
          activeBg: 'bg-purple-950/80',
          shadow: 'shadow-purple-500/20',
          text: 'text-purple-400',
          badgeBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
          handleBg: '#a855f7',
          icon: <HelpCircle className="h-3.5 w-3.5 text-purple-400 shrink-0" />,
        };
    }
  };

  const styles = getVerdictStyles(verdict);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (data.claimId) {
          selectClaim(data.claimId);
        }
      }}
      className={`group relative w-[250px] rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-lg ${styles.border} ${
        isSelected
          ? `${styles.activeBg} ring-2 ring-blue-400 shadow-blue-500/40 scale-105`
          : isHighlighted
          ? `${styles.activeBg} ${styles.shadow}`
          : isDimmed
          ? 'opacity-20 border-slate-800 bg-slate-950/30'
          : `${styles.bg} ${styles.shadow} hover:scale-[1.02]`
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-slate-900"
        style={{ backgroundColor: styles.handleBg }}
      />

      <div className="p-3">
        {/* Header with blue badge pill and verdict badge */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            {/* Blue pill like reference */}
            <span className="flex h-5 items-center justify-center rounded-full bg-blue-600 px-2 text-[10px] font-mono font-bold text-white shadow-sm shadow-blue-500/50">
              [{data.claimIndex || 1}]
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">
              {data.claimId}
            </span>
          </div>

          <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badgeBg}`}>
            {styles.icon}
            <span>{verdict.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Claim Text */}
        <p className="text-xs font-medium text-slate-100 line-clamp-2 leading-relaxed mb-2.5 font-sans" title={data.claimText}>
          {data.claimText || data.label}
        </p>

        {/* Footer: Confidence and Rule ID */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
          <div className="flex items-center gap-1.5 font-mono text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-semibold text-slate-200">{confidencePct}%</span>
            <span className="text-[9px] text-slate-500">conf</span>
          </div>

          {data.ruleId && (
            <span className="rounded bg-slate-800/90 border border-slate-700/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-300 truncate max-w-[110px]" title={data.ruleId}>
              {data.ruleId}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-slate-900"
        style={{ backgroundColor: styles.handleBg }}
      />
    </div>
  );
};
