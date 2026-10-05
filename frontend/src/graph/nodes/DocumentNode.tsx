import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, Layers } from 'lucide-react';
import { GraphNodeData } from '../buildGraph';
import { useTraceStore } from '../../store/useTraceStore';

export const DocumentNode: React.FC<{ data: GraphNodeData; id: string }> = ({ data, id }) => {
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
      className={`group relative w-[220px] rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-lg ${
        isSelected
          ? 'border-yellow-400 bg-yellow-950/60 shadow-yellow-500/30 scale-105 ring-2 ring-yellow-400/50'
          : isHighlighted
          ? 'border-yellow-400 bg-yellow-950/40 shadow-yellow-500/20'
          : isDimmed
          ? 'opacity-20 border-yellow-800/40 bg-yellow-950/10'
          : 'border-yellow-600/70 bg-gradient-to-b from-yellow-950/40 to-slate-900/90 hover:border-yellow-400 shadow-yellow-900/10'
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-yellow-400/80 font-bold block">
                SOURCE DOCUMENT
              </span>
              <h4 className="text-xs font-semibold text-slate-100 truncate" title={data.label}>
                {data.label}
              </h4>
            </div>
          </div>

          {/* Satellite count badge */}
          {typeof data.satelliteCount === 'number' && (
            <div
              className="flex items-center gap-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 text-[10px] font-mono font-medium text-yellow-300"
              title={`${data.satelliteCount} passages extracted`}
            >
              <Layers className="h-2.5 w-2.5" />
              <span>{data.satelliteCount}</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-yellow-500/20 pt-1.5">
          <span>Format: PDF / Text</span>
          <span className="text-yellow-400/90 font-medium">Grounding Root</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-yellow-400 !border-2 !border-slate-900"
      />
    </div>
  );
};
