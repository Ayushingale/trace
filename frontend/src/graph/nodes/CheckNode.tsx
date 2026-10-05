import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Binary, Network, Cpu, Layers } from 'lucide-react';
import { CHECK_METADATA, GraphNodeData } from '../buildGraph';
import { useTraceStore } from '../../store/useTraceStore';

export const CheckNode: React.FC<{ data: GraphNodeData; id: string }> = ({ data, id }) => {
  const { upstreamNodeIds, selectedNodeId, selectNode } = useTraceStore();
  const isSelected = selectedNodeId === id;
  const isHighlighted = upstreamNodeIds.has(id);
  const isDimmed = upstreamNodeIds.size > 0 && !isHighlighted;

  const cat = data.checkCategory || 'deterministic';
  const meta = CHECK_METADATA[cat];

  const getIcon = () => {
    switch (cat) {
      case 'deterministic':
        return <Binary className="h-4 w-4" />;
      case 'nli':
        return <Network className="h-4 w-4" />;
      case 'judge':
        return <Cpu className="h-4 w-4" />;
      case 'combiner':
        return <Layers className="h-4 w-4" />;
      default:
        return <Binary className="h-4 w-4" />;
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(id);
      }}
      className={`group relative w-[220px] rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-lg ${
        isSelected
          ? 'scale-105 ring-2 ring-indigo-400/50 shadow-indigo-500/30'
          : ''
      } ${
        isHighlighted
          ? 'shadow-lg bg-slate-900/95'
          : isDimmed
          ? 'opacity-20 border-slate-800 bg-slate-900/20'
          : 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 hover:border-indigo-400 shadow-slate-950/50'
      }`}
      style={{
        borderColor: isHighlighted || isSelected ? meta.accentColor : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-slate-900"
        style={{ backgroundColor: meta.accentColor }}
      />

      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-inner"
            style={{
              backgroundColor: `${meta.accentColor}20`,
              borderColor: `${meta.accentColor}60`,
              color: meta.accentColor,
            }}
          >
            {getIcon()}
          </div>
          <div className="min-w-0">
            <span
              className="text-[9px] font-mono uppercase tracking-wider font-bold block"
              style={{ color: meta.accentColor }}
            >
              VERIFICATION ENGINE
            </span>
            <h4 className="text-xs font-bold text-slate-100 truncate">{meta.name}</h4>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight mb-2">
          {meta.subtitle}
        </p>

        <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-800/80 pt-1.5 text-slate-400">
          <span>Engine Type</span>
          <span
            className="font-semibold uppercase tracking-wider"
            style={{ color: meta.accentColor }}
          >
            {cat}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-slate-900"
        style={{ backgroundColor: meta.accentColor }}
      />
    </div>
  );
};
