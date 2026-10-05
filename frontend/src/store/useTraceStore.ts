import { create } from 'zustand';
import { Claim, ReviewAction, Verdict } from '../api/types';
import { buildGraph, BuildGraphResult, getUpstreamPath, GraphEdge, GraphNode } from '../graph/buildGraph';
import mockClaimsRaw from '../mocks/claims.json';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  claims?: Claim[];
  isVerifying?: boolean;
}

export interface PdfHighlightState {
  docId: string;
  page: number;
  bbox?: number[];
  passageText?: string;
  flashKey?: number;
}

interface TraceState {
  // Claims & Graph
  claims: Claim[];
  graph: BuildGraphResult;
  selectedClaimId: string | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  upstreamNodeIds: Set<string>;
  upstreamEdgeIds: Set<string>;

  // Filters & Search
  searchQuery: string;
  verdictFilters: Set<Verdict>;

  // PDF Viewer Drawer
  isPdfOpen: boolean;
  activePdf: PdfHighlightState | null;

  // Tabs & Mode
  activeTab: 'verify' | 'ask';
  sourceText: string;
  askQuestion: string;
  uploadedFiles: File[];
  useMocks: boolean;
  isStreaming: boolean;
  currentStreamClaimIndex: number;
  isFullscreen: boolean;

  // Chat History
  chatHistory: ChatMessage[];

  // Actions
  setClaims: (claims: Claim[]) => void;
  selectClaim: (claimId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleVerdictFilter: (verdict: Verdict) => void;
  resetFilters: () => void;

  openPdf: (pdf: PdfHighlightState) => void;
  closePdf: () => void;

  setActiveTab: (tab: 'verify' | 'ask') => void;
  setSourceText: (text: string) => void;
  setAskQuestion: (q: string) => void;
  setUploadedFiles: (files: File[]) => void;
  setUseMocks: (use: boolean) => void;
  toggleFullscreen: () => void;

  reviewClaim: (claimId: string, action: ReviewAction, newVerdict?: Verdict) => void;
  clearChat: () => void;
  startStreamingDemo: () => void;
  exportAuditJson: () => void;
}

const DEFAULT_VERDICTS: Verdict[] = ['SUPPORTED', 'CONTRADICTED', 'UNSUPPORTED', 'NEEDS_REVIEW'];

const INITIAL_TEXT = `The contract term is fixed for a period of 24 months. Payment is due within 30 days of invoice receipt. The supplier holds ISO 27001 certification across all global data centers. Either party may terminate without cause by giving 60 days written notice. Liability for consequential damages is uncapped under gross negligence.`;

export const useTraceStore = create<TraceState>((set, get) => {
  const initialClaims = mockClaimsRaw as Claim[];
  const initialGraph = buildGraph(initialClaims);

  return {
    claims: initialClaims,
    graph: initialGraph,
    selectedClaimId: 'c_001',
    selectedNodeId: 'claim_c_001',
    hoveredNodeId: null,
    upstreamNodeIds: getUpstreamPath('claim_c_001', initialGraph.edges).nodeIds,
    upstreamEdgeIds: getUpstreamPath('claim_c_001', initialGraph.edges).edgeIds,

    searchQuery: '',
    verdictFilters: new Set<Verdict>(DEFAULT_VERDICTS),

    isPdfOpen: false,
    activePdf: {
      docId: 'master_agreement.pdf',
      page: 1,
      bbox: [72.0, 140.0, 520.0, 168.0],
      passageText: '2.1 Term: This Agreement shall commence on the Effective Date and continue for twenty-four (24) months.',
      flashKey: 1,
    },

    activeTab: 'verify',
    sourceText: INITIAL_TEXT,
    askQuestion: 'What are the termination notice requirements and payment duration terms?',
    uploadedFiles: [],
    useMocks: true,
    isStreaming: false,
    currentStreamClaimIndex: 0,
    isFullscreen: false,

    chatHistory: [
      {
        id: 'msg_1',
        role: 'user',
        content: 'Please verify the extracted summary of master_agreement.pdf regarding terms, payment window, ISO certifications, and liability caps.',
        timestamp: '10:14 AM',
      },
      {
        id: 'msg_2',
        role: 'assistant',
        content: INITIAL_TEXT,
        timestamp: '10:15 AM',
        claims: initialClaims,
      },
    ],

    setClaims: (newClaims: Claim[]) => {
      const newGraph = buildGraph(newClaims);
      const currentSelected = get().selectedClaimId;
      const targetClaimId = newClaims.some((c) => c.claim_id === currentSelected)
        ? currentSelected
        : newClaims[0]?.claim_id || null;

      let upstreamNodes = new Set<string>();
      let upstreamEdges = new Set<string>();
      if (targetClaimId) {
        const path = getUpstreamPath(`claim_${targetClaimId}`, newGraph.edges);
        upstreamNodes = path.nodeIds;
        upstreamEdges = path.edgeIds;
      }

      set({
        claims: newClaims,
        graph: newGraph,
        selectedClaimId: targetClaimId,
        selectedNodeId: targetClaimId ? `claim_${targetClaimId}` : null,
        upstreamNodeIds: upstreamNodes,
        upstreamEdgeIds: upstreamEdges,
      });
    },

    selectClaim: (claimId: string | null) => {
      const state = get();
      if (!claimId) {
        set({
          selectedClaimId: null,
          selectedNodeId: null,
          upstreamNodeIds: new Set(),
          upstreamEdgeIds: new Set(),
        });
        return;
      }

      const claimNodeId = `claim_${claimId}`;
      const { nodeIds, edgeIds } = getUpstreamPath(claimNodeId, state.graph.edges);

      // Auto-preview evidence in PDF drawer if available
      const claim = state.claims.find((c) => c.claim_id === claimId);
      let newPdfState = state.activePdf;
      if (claim && claim.evidence && claim.evidence.length > 0) {
        const topEv = claim.evidence[0];
        newPdfState = {
          docId: topEv.doc_id,
          page: topEv.page,
          bbox: topEv.bbox,
          passageText: topEv.passage_text,
          flashKey: Date.now(),
        };
      }

      set({
        selectedClaimId: claimId,
        selectedNodeId: claimNodeId,
        upstreamNodeIds: nodeIds,
        upstreamEdgeIds: edgeIds,
        activePdf: newPdfState,
      });
    },

    selectNode: (nodeId: string | null) => {
      const state = get();
      if (!nodeId) {
        set({
          selectedNodeId: null,
          selectedClaimId: null,
          upstreamNodeIds: new Set(),
          upstreamEdgeIds: new Set(),
        });
        return;
      }

      // If a claim node is clicked:
      if (nodeId.startsWith('claim_')) {
        const claimId = nodeId.replace('claim_', '');
        get().selectClaim(claimId);
        return;
      }

      // If a passage node is clicked:
      if (nodeId.startsWith('passage_')) {
        const pNode = state.graph.nodes.find((n) => n.id === nodeId);
        if (pNode && pNode.data.page) {
          set({
            selectedNodeId: nodeId,
            isPdfOpen: true,
            activePdf: {
              docId: pNode.data.docId || 'master_agreement.pdf',
              page: pNode.data.page,
              bbox: pNode.data.bbox,
              passageText: pNode.data.passageText,
              flashKey: Date.now(),
            },
          });
        }
      }

      const { nodeIds, edgeIds } = getUpstreamPath(nodeId, state.graph.edges);
      set({
        selectedNodeId: nodeId,
        upstreamNodeIds: nodeIds,
        upstreamEdgeIds: edgeIds,
      });
    },

    setHoveredNode: (nodeId: string | null) => set({ hoveredNodeId: nodeId }),

    setSearchQuery: (query: string) => set({ searchQuery: query }),

    toggleVerdictFilter: (verdict: Verdict) => {
      const current = new Set(get().verdictFilters);
      if (current.has(verdict)) {
        if (current.size > 1) {
          current.delete(verdict);
        }
      } else {
        current.add(verdict);
      }
      set({ verdictFilters: current });
    },

    resetFilters: () => set({ verdictFilters: new Set<Verdict>(DEFAULT_VERDICTS), searchQuery: '' }),

    openPdf: (pdf: PdfHighlightState) => set({ isPdfOpen: true, activePdf: { ...pdf, flashKey: Date.now() } }),

    closePdf: () => set({ isPdfOpen: false }),

    setActiveTab: (tab: 'verify' | 'ask') => set({ activeTab: tab }),

    setSourceText: (text: string) => set({ sourceText: text }),

    setAskQuestion: (q: string) => set({ askQuestion: q }),

    setUploadedFiles: (files: File[]) => set({ uploadedFiles: files }),

    setUseMocks: (use: boolean) => set({ useMocks: use }),

    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        set({ isFullscreen: true });
      } else {
        document.exitFullscreen().catch(() => {});
        set({ isFullscreen: false });
      }
    },

    reviewClaim: (claimId: string, action: ReviewAction, newVerdict?: Verdict) => {
      const state = get();
      const updated = state.claims.map((c) => {
        if (c.claim_id !== claimId) return c;
        let newStatus: Claim['review_status'] = 'none';
        let updatedVerdict = c.verdict;

        if (action === 'confirm') {
          newStatus = 'confirmed';
        } else if (action === 'override') {
          newStatus = 'overridden';
          if (newVerdict) updatedVerdict = newVerdict;
        } else if (action === 'needs_more_evidence') {
          newStatus = 'pending';
          updatedVerdict = 'NEEDS_REVIEW';
        }

        return {
          ...c,
          review_status: newStatus,
          verdict: updatedVerdict,
        };
      });

      const newGraph = buildGraph(updated);
      const { nodeIds, edgeIds } = getUpstreamPath(`claim_${claimId}`, newGraph.edges);

      set({
        claims: updated,
        graph: newGraph,
        upstreamNodeIds: nodeIds,
        upstreamEdgeIds: edgeIds,
      });
    },

    clearChat: () => {
      set({
        chatHistory: [],
        claims: [],
        graph: buildGraph([]),
        selectedClaimId: null,
        selectedNodeId: null,
        upstreamNodeIds: new Set(),
        upstreamEdgeIds: new Set(),
        sourceText: '',
      });
    },

    startStreamingDemo: () => {
      const allMock = mockClaimsRaw as Claim[];
      const state = get();
      if (state.isStreaming) return;

      set({
        isStreaming: true,
        claims: [],
        graph: buildGraph([]),
        selectedClaimId: null,
        selectedNodeId: null,
        chatHistory: [
          ...state.chatHistory,
          {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: state.sourceText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            claims: [],
            isVerifying: true,
          },
        ],
      });

      // Stream claims in one by one every 700ms
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx >= allMock.length) {
          clearInterval(interval);
          set({ isStreaming: false });
          return;
        }

        const nextClaim = allMock[currentIdx];
        const nextClaims = allMock.slice(0, currentIdx + 1);
        const nextGraph = buildGraph(nextClaims);
        const { nodeIds, edgeIds } = getUpstreamPath(`claim_${nextClaim.claim_id}`, nextGraph.edges);

        set((prev) => ({
          claims: nextClaims,
          graph: nextGraph,
          selectedClaimId: nextClaim.claim_id,
          selectedNodeId: `claim_${nextClaim.claim_id}`,
          upstreamNodeIds: nodeIds,
          upstreamEdgeIds: edgeIds,
          currentStreamClaimIndex: currentIdx + 1,
        }));

        currentIdx++;
      }, 700);
    },

    exportAuditJson: () => {
      const state = get();
      const exportData = {
        traceVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        document: state.activePdf?.docId || 'master_agreement.pdf',
        metrics: state.graph.metadata,
        claims: state.claims,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trace-audit-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
});
