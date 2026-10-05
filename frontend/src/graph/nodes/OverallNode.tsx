import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Activity, CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { GraphNodeData } from '../buildGraph';
import { useTraceStore } from '../../store/useTraceStore';

export const OverallNode: React.FC<{ data: GraphNodeData; id: string }> = ({ data, id }) => {
  const { upstreamNodeIds, selectedNodeId, selectNode } = useTraceStore();
  const isSelected = selectedNodeId === id;
  const isHighlighted = upstreamNodeIds.has(id);
  const isDimmed = upstreamNodeIds.size > 0 && !isHighlighted;

  const stats = data.stats || {
    total: 0,
    supported: 0,
    contradicted: 0,
    unsupported: 0,
    needsReview: 0,
    trustScore: 0,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(id);
      }}
      className={`group relative w-[230px] rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-xl ${
        isSelected
          ? 'scale-105 ring-2 ring-emerald-400/50 border-emerald-400 shadow-emerald-500/30'
          : isHighlighted
          ? 'border-emerald-400 bg-slate-900/95 shadow-emerald-500/20'
          : isDimmed
          ? 'opacity-20 border-slate-800 bg-slate-950/40'
          : 'border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:border-slate-500 shadow-slate-950/80'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-emerald-400/90 block">
                AGGREGATE INDEX
              </span>
              <h4 className="text-xs font-bold text-slate-100">Trace Grounding</h4>
            </div>
          </div>

          {/* Trust Score Gauge */}
          <div className={`flex flex-col items-center rounded-lg border px-2 py-1 font-mono ${getScoreColor(stats.trustScore)}`}>
            <span className="text-sm font-black leading-none">{stats.trustScore}%</span>
            <span className="text-[8px] uppercase tracking-tighter opacity-80">Trust</span>
          </div>
        </div>

        {/* Verdict counts grid */}
        <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 p-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>{stats.supported}</span>
            </div>
            <span className="text-[8px] text-slate-500 uppercase font-mono">Supp</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-rose-400">
              <XCircle className="h-2.5 w-2.5" />
              <span>{stats.contradicted}</span>
            </div>
            <span className="text-[8px] text-slate-500 uppercase font-mono">Contra</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              <span>{stats.unsupported}</span>
            </div>
            <span className="text-[8px] text-slate-500 uppercase font-mono">Unsupp</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-purple-400">
              <HelpCircle className="h-2.5 w-2.5" />
              <span>{stats.needsReview}</span>
            </div>
            <span className="text-[8px] text-slate-500 uppercase font-mono">Review</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span>Total Atomic Claims</span>
          <span className="font-mono font-bold text-slate-200">{stats.total}</span>
        </div>
      </div>
    </div>
  );
};
