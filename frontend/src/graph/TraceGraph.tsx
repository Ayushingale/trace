import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useTraceStore } from '../store/useTraceStore';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { getVerdictColor } from './buildGraph';
import { LayoutGrid, ZoomIn, RefreshCw, Eye } from 'lucide-react';

const TraceGraphInner: React.FC = () => {
  const {
    graph,
    selectedClaimId,
    selectedNodeId,
    upstreamNodeIds,
    searchQuery,
    verdictFilters,
    selectNode,
    selectClaim,
    isStreaming,
  } = useTraceStore();

  const { fitView } = useReactFlow();

  // Filter nodes based on verdict filters and search query
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      // If it's a claim node, check verdict filter
      if (node.data.nodeType === 'claim' && node.data.verdict) {
        if (!verdictFilters.has(node.data.verdict)) return false;
      }

      // If search query exists, test match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = (node.data.label || '').toLowerCase().includes(q);
        const matchesText = (node.data.claimText || node.data.passageText || '').toLowerCase().includes(q);
        const matchesRule = (node.data.ruleId || '').toLowerCase().includes(q);
        return matchesLabel || matchesText || matchesRule;
      }

      return true;
    });
  }, [graph.nodes, verdictFilters, searchQuery]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filter edges to only connect visible nodes
  const filteredEdges = useMemo(() => {
    return graph.edges
      .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map((edge) => {
        const edgeVerdict = edge.data?.verdict;
        const color = edgeVerdict ? getVerdictColor(edgeVerdict) : (edge.style?.stroke as string) || '#64748b';
        return {
          ...edge,
          type: 'traceEdge',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color,
          },
        };
      });
  }, [graph.edges, visibleNodeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Sync internal React Flow state when store graph changes
  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  // When selectedClaimId or selectedNodeId changes, auto fitView on the upstream path
  useEffect(() => {
    if (upstreamNodeIds.size > 0) {
      const targetNodes = Array.from(upstreamNodeIds).map((id) => ({ id }));
      setTimeout(() => {
        fitView({
          nodes: targetNodes,
          duration: 600,
          padding: 0.35,
          maxZoom: 1.2,
        });
      }, 50);
    } else {
      setTimeout(() => {
        fitView({ duration: 500, padding: 0.2 });
      }, 50);
    }
  }, [selectedClaimId, selectedNodeId, upstreamNodeIds, fitView]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleResetLayout = () => {
    fitView({ duration: 500, padding: 0.15 });
  };

  return (
    <div className="relative h-full w-full bg-[#080c14] overflow-hidden select-none">
      {/* Floating Canvas Quick Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 p-1 shadow-xl backdrop-blur-md">
        <button
          onClick={handleResetLayout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Fit view to graph"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
          <span>Reset Layout</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-1.5 px-2 text-xs font-mono text-slate-400">
          <Eye className="h-3.5 w-3.5 text-blue-400" />
          <span>
            {filteredNodes.length} nodes · {filteredEdges.length} links
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{
          animated: true,
          type: 'traceEdge',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#1e293b"
          className="opacity-70"
        />
        <Controls
          className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-2xl [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-800 [&>button:hover]:!text-white"
        />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node: any) => {
            switch (node.data?.nodeType) {
              case 'document':
                return '#eab308';
              case 'passage':
                return '#06b6d4';
              case 'check':
                return '#6366f1';
              case 'claim':
                return getVerdictColor(node.data?.verdict);
              case 'overall':
                return '#10b981';
              default:
                return '#64748b';
            }
          }}
          className="!bg-slate-950/80 !border-slate-800 !rounded-xl !overflow-hidden !shadow-2xl"
          maskColor="rgba(8, 12, 20, 0.7)"
        />
      </ReactFlow>

      {/* Empty State Overlay */}
      {filteredNodes.length === 0 && !isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm z-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-4 shadow-xl">
            <LayoutGrid className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Trace Nodes Visible</h3>
          <p className="text-xs text-slate-400 max-w-sm text-center mt-1">
            Adjust your verdict filters or search query, or submit text on the left panel to generate the 5-layer lineage graph.
          </p>
        </div>
      )}

      {/* Streaming pulse indicator */}
      {isStreaming && (
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 rounded-full bg-slate-900/90 border border-blue-500/40 px-3 py-1.5 text-xs text-blue-300 shadow-xl backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="font-mono font-medium">Streaming verification graph...</span>
        </div>
      )}
    </div>
  );
};

export const TraceGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <TraceGraphInner />
    </ReactFlowProvider>
  );
};
