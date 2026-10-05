import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MoreHorizontal } from 'lucide-react';
import { GraphNodeData } from '../buildGraph';

export const CollapsedPassagesNode: React.FC<{ data: GraphNodeData; id: string }> = ({ data }) => {
  return (
    <div className="relative w-[170px] rounded-lg border border-dashed border-slate-600 bg-slate-900/60 p-2 text-center text-slate-400 shadow-sm backdrop-blur-sm">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-500 !border-2 !border-slate-900"
      />
      <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-medium text-slate-300">
        <MoreHorizontal className="h-3.5 w-3.5" />
        <span>{data.label}</span>
      </div>
    </div>
  );
};
