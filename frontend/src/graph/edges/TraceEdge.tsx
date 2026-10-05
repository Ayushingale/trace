import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { useTraceStore } from '../../store/useTraceStore';
import { getVerdictColor } from '../buildGraph';
import { Verdict } from '../../api/types';

export const TraceEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const { upstreamEdgeIds } = useTraceStore();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isHighlighted = upstreamEdgeIds.has(id);
  const isDimmed = upstreamEdgeIds.size > 0 && !isHighlighted;

  const edgeData = data as { verdict?: Verdict; ruleId?: string } | undefined;
  const strokeColor = edgeData?.verdict ? getVerdictColor(edgeData.verdict) : (style.stroke as string) || '#64748b';

  const edgeStyle: React.CSSProperties = {
    ...style,
    stroke: isHighlighted ? '#38bdf8' : strokeColor,
    strokeWidth: isHighlighted ? 3 : isDimmed ? 1 : (style.strokeWidth as number) || 2,
    opacity: isDimmed ? 0.15 : 1,
    transition: 'all 0.3s ease',
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {edgeData?.ruleId && (
        <foreignObject
          width={100}
          height={24}
          x={labelX - 50}
          y={labelY - 12}
          className="pointer-events-none overflow-visible"
        >
          <div
            className={`flex items-center justify-center rounded px-1.5 py-0.5 text-[8px] font-mono font-semibold transition-opacity duration-300 ${
              isDimmed ? 'opacity-10' : 'opacity-90'
            }`}
            style={{
              backgroundColor: '#0f172aee',
              color: isHighlighted ? '#38bdf8' : strokeColor,
              border: `1px solid ${isHighlighted ? '#38bdf8' : strokeColor}60`,
            }}
          >
            {edgeData.ruleId}
          </div>
        </foreignObject>
      )}
    </>
  );
};
