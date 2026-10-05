import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { GraphNodeData } from '../buildGraph';
import { useTraceStore } from '../../store/useTraceStore';

export const PassageNode: React.FC<{ data: GraphNodeData; id: string }> = ({ data, id }) => {
  const { upstreamNodeIds, selectedNodeId, selectNode } = useTraceStore();
  const isSelected = selectedNodeId === id;
  const isHighlighted = upstreamNodeIds.has(id);
  const isDimmed = upstreamNodeIds.size > 0 && !isHighlighted;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(id);
      }}
      className={`group relative w-[200px] rounded-lg border transition-all duration-300 cursor-pointer shadow-md ${
        isSelected
          ? 'border-cyan-400 bg-cyan-950/80 shadow-cyan-500/40 ring-2 ring-cyan-400/50 scale-105'
          : isHighlighted
          ? 'border-cyan-400 bg-cyan-950/50 shadow-cyan-500/20'
          : isDimmed
          ? 'opacity-20 border-slate-800 bg-slate-900/40'
          : 'border-cyan-700/60 bg-gradient-to-b from-slate-900/90 to-slate-950/90 hover:border-cyan-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-900"
      />

      <div className="p-2">
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-1 rounded bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
              <BookOpen className="h-3 w-3" />
              p.{data.page || 1}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold truncate">
              Passage
            </span>
          </div>

          <div className="flex items-center gap-1">
            {typeof data.satelliteCount === 'number' && (
              <span
                className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300 border border-slate-700"
                title={`Used in ${data.satelliteCount} claims`}
              >
                {data.satelliteCount}c
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-cyan-400/60 group-hover:text-cyan-300 transition-colors" />
          </div>
        </div>

        <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight font-sans italic" title={data.passageText}>
          "{data.passageText || data.label}"
        </p>

        <div className="mt-1.5 flex items-center justify-between text-[9px] text-cyan-400/70 border-t border-cyan-900/40 pt-1">
          <span>Click to view in PDF</span>
          {data.bbox && <span>Coordinates ready</span>}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-900"
      />
    </div>
  );
};
