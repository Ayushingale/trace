import dagre from 'dagre';
import { Claim, Evidence, Verdict } from '../api/types';

export type CheckCategory = 'deterministic' | 'nli' | 'judge' | 'combiner';

export interface GraphNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  nodeType: 'document' | 'passage' | 'check' | 'claim' | 'overall' | 'collapsed_passages';
  docId?: string;
  page?: number;
  bbox?: number[];
  passageText?: string;
  ruleId?: string;
  claimId?: string;
  claimIndex?: number;
  claimText?: string;
  claimType?: string;
  verdict?: Verdict;
  confidence?: number;
  reason?: string;
  checkCategory?: CheckCategory;
  stats?: {
    total: number;
    supported: number;
    contradicted: number;
    unsupported: number;
    needsReview: number;
    trustScore: number;
  };
  satelliteCount?: number;
  collapsedCount?: number;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: GraphNodeData;
  style?: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
  style?: Record<string, unknown>;
  data?: {
    verdict?: Verdict;
    ruleId?: string;
    isHighlighted?: boolean;
  };
}

export interface BuildGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalDocuments: number;
    totalPassages: number;
    totalChecks: number;
    totalClaims: number;
    trustScore: number;
  };
}

export function categorizeRuleId(ruleId?: string): CheckCategory {
  if (!ruleId) return 'combiner';
  const lower = ruleId.toLowerCase();
  if (
    lower.startsWith('num.') ||
    lower.startsWith('date.') ||
    lower.startsWith('dur.') ||
    lower.startsWith('mod.') ||
    lower.startsWith('neg.') ||
    lower.startsWith('ent.')
  ) {
    return 'deterministic';
  }
  if (lower.startsWith('nli')) return 'nli';
  if (lower.startsWith('judge') || lower.includes('llm')) return 'judge';
  if (lower.startsWith('combiner')) return 'combiner';
  return 'deterministic';
}

export const CHECK_METADATA: Record<
  CheckCategory,
  { name: string; subtitle: string; icon: string; accentColor: string }
> = {
  deterministic: {
    name: 'Deterministic Checks',
    subtitle: 'Units, Dates, Negation, Entities',
    icon: 'Binary',
    accentColor: '#38bdf8', // Sky blue
  },
  nli: {
    name: 'NLI Cross-Encoder',
    subtitle: 'DeBERTa-v3 Semantic Entailment',
    icon: 'Network',
    accentColor: '#818cf8', // Indigo
  },
  judge: {
    name: 'LLM Judge',
    subtitle: 'Few-Shot Reasoning Arbiter',
    icon: 'Cpu',
    accentColor: '#f472b6', // Pink
  },
  combiner: {
    name: 'Calibrated Combiner',
    subtitle: 'Platt-Scaled Ensemble & Abstention',
    icon: 'Layers',
    accentColor: '#34d399', // Emerald
  },
};

/**
 * Builds a 5-layer Source Trace Graph from a list of Claims.
 * Layer 1: Document Nodes
 * Layer 2: Passage Nodes (collapsed if >15 per doc)
 * Layer 3: Check Nodes (Deterministic, NLI, LLM Judge, Combiner)
 * Layer 4: Claim Nodes
 * Layer 5: Overall Summary Node
 */
export function buildGraph(claims: Claim[], options?: { rankdir?: 'LR' | 'TB' }): BuildGraphResult {
  const rankdir = options?.rankdir || 'LR';
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir,
    nodesep: 45,
    ranksep: 95,
    marginx: 30,
    marginy: 30,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (!claims || claims.length === 0) {
    return {
      nodes: [],
      edges: [],
      metadata: {
        totalDocuments: 0,
        totalPassages: 0,
        totalChecks: 0,
        totalClaims: 0,
        trustScore: 0,
      },
    };
  }

  // 1. Collect unique Documents and Passages
  const docMap = new Map<string, { docId: string; passages: Map<string, Evidence & { claimIds: string[] }> }>();
  const activeCheckCategories = new Set<CheckCategory>();

  // Count verdicts for Layer 5 Overall Node
  let supportedCount = 0;
  let contradictedCount = 0;
  let unsupportedCount = 0;
  let needsReviewCount = 0;

  claims.forEach((claim) => {
    switch (claim.verdict) {
      case 'SUPPORTED':
        supportedCount++;
        break;
      case 'CONTRADICTED':
        contradictedCount++;
        break;
      case 'UNSUPPORTED':
        unsupportedCount++;
        break;
      case 'NEEDS_REVIEW':
        needsReviewCount++;
        break;
    }

    const checkCat = categorizeRuleId(claim.rule_id);
    activeCheckCategories.add(checkCat);

    if (claim.evidence && claim.evidence.length > 0) {
      claim.evidence.forEach((ev) => {
        const docId = ev.doc_id || 'document.pdf';
        if (!docMap.has(docId)) {
          docMap.set(docId, { docId, passages: new Map() });
        }
        const docEntry = docMap.get(docId)!;
        // Key passage uniquely by doc, page, and first 40 chars of text
        const passageKey = `${ev.page}_${(ev.passage_text || '').slice(0, 40).trim()}`;
        if (!docEntry.passages.has(passageKey)) {
          docEntry.passages.set(passageKey, { ...ev, doc_id: docId, claimIds: [claim.claim_id] });
        } else {
          const p = docEntry.passages.get(passageKey)!;
          if (!p.claimIds.includes(claim.claim_id)) {
            p.claimIds.push(claim.claim_id);
          }
        }
      });
    }
  });

  // Fallback if no documents found (e.g. all unsupported claims without evidence)
  if (docMap.size === 0) {
    docMap.set('source_repository', { docId: 'source_repository', passages: new Map() });
  }

  // Layer 1: Documents
  docMap.forEach((entry, docId) => {
    const docNodeId = `doc_${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const node: GraphNode = {
      id: docNodeId,
      type: 'documentNode',
      position: { x: 0, y: 0 },
      width: 220,
      height: 90,
      data: {
        id: docNodeId,
        label: docId,
        nodeType: 'document',
        docId,
        satelliteCount: entry.passages.size,
      },
    };
    nodes.push(node);
    g.setNode(docNodeId, { width: 220, height: 90 });
  });

  // Layer 2: Passages (handle up to ~100 nodes, collapse if > 15)
  const passageNodeIdMap = new Map<string, string>(); // passageKey -> nodeId
  let totalPassageCount = 0;

  docMap.forEach((entry, docId) => {
    const docNodeId = `doc_${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const passageList = Array.from(entry.passages.entries());
    totalPassageCount += passageList.length;

    const MAX_PASSAGES_PER_DOC = 15;
    const shouldCollapse = passageList.length > MAX_PASSAGES_PER_DOC;
    const displayPassages = shouldCollapse ? passageList.slice(0, MAX_PASSAGES_PER_DOC - 1) : passageList;

    displayPassages.forEach(([pKey, ev]) => {
      const pId = `passage_${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${pKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      passageNodeIdMap.set(`${docId}_${pKey}`, pId);

      const snippet = (ev.passage_text || '').trim();
      const label = `p.${ev.page} · ${snippet.slice(0, 42)}${snippet.length > 42 ? '...' : ''}`;

      const node: GraphNode = {
        id: pId,
        type: 'passageNode',
        position: { x: 0, y: 0 },
        width: 200,
        height: 65,
        data: {
          id: pId,
          label,
          nodeType: 'passage',
          docId,
          page: ev.page,
          bbox: ev.bbox,
          passageText: ev.passage_text,
          satelliteCount: ev.claimIds.length,
        },
      };
      nodes.push(node);
      g.setNode(pId, { width: 200, height: 65 });

      // Edge: Document -> Passage
      const edgeId = `e_${docNodeId}_${pId}`;
      edges.push({
        id: edgeId,
        source: docNodeId,
        target: pId,
        animated: true,
        style: { stroke: '#eab308', strokeWidth: 2 },
      });
      g.setEdge(docNodeId, pId);
    });

    if (shouldCollapse) {
      const collapsedId = `collapsed_${docNodeId}`;
      const remainingCount = passageList.length - (MAX_PASSAGES_PER_DOC - 1);
      const collapsedNode: GraphNode = {
        id: collapsedId,
        type: 'collapsedPassagesNode',
        position: { x: 0, y: 0 },
        width: 170,
        height: 50,
        data: {
          id: collapsedId,
          label: `+${remainingCount} more passages`,
          nodeType: 'collapsed_passages',
          docId,
          collapsedCount: remainingCount,
        },
      };
      nodes.push(collapsedNode);
      g.setNode(collapsedId, { width: 170, height: 50 });

      edges.push({
        id: `e_${docNodeId}_${collapsedId}`,
        source: docNodeId,
        target: collapsedId,
        animated: false,
        style: { stroke: '#94a3b8', strokeDasharray: '4 4' },
      });
      g.setEdge(docNodeId, collapsedId);
    }
  });

  // Layer 3: Check Nodes
  const checkNodeIds = new Map<CheckCategory, string>();
  activeCheckCategories.forEach((cat) => {
    const checkId = `check_${cat}`;
    checkNodeIds.set(cat, checkId);
    const meta = CHECK_METADATA[cat];

    const checkNode: GraphNode = {
      id: checkId,
      type: 'checkNode',
      position: { x: 0, y: 0 },
      width: 220,
      height: 80,
      data: {
        id: checkId,
        label: meta.name,
        nodeType: 'check',
        checkCategory: cat,
      },
    };
    nodes.push(checkNode);
    g.setNode(checkId, { width: 220, height: 80 });
  });

  // Connect Passages to Check Nodes based on claims
  const passageToCheckEdgeSet = new Set<string>();
  claims.forEach((claim) => {
    const cat = categorizeRuleId(claim.rule_id);
    const checkId = checkNodeIds.get(cat);
    if (!checkId) return;

    if (claim.evidence && claim.evidence.length > 0) {
      claim.evidence.forEach((ev) => {
        const docId = ev.doc_id || 'document.pdf';
        const pKey = `${ev.page}_${(ev.passage_text || '').slice(0, 40).trim()}`;
        const pNodeId = passageNodeIdMap.get(`${docId}_${pKey}`);
        if (pNodeId) {
          const edgeKey = `${pNodeId}->${checkId}`;
          if (!passageToCheckEdgeSet.has(edgeKey)) {
            passageToCheckEdgeSet.add(edgeKey);
            edges.push({
              id: `e_${pNodeId}_${checkId}`,
              source: pNodeId,
              target: checkId,
              animated: true,
              style: { stroke: CHECK_METADATA[cat].accentColor, strokeWidth: 2 },
            });
            g.setEdge(pNodeId, checkId);
          }
        }
      });
    } else {
      // Connect document directly to check if claim has no evidence
      docMap.forEach((_, docId) => {
        const docNodeId = `doc_${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const edgeKey = `${docNodeId}->${checkId}`;
        if (!passageToCheckEdgeSet.has(edgeKey)) {
          passageToCheckEdgeSet.add(edgeKey);
          edges.push({
            id: `e_${docNodeId}_${checkId}_direct`,
            source: docNodeId,
            target: checkId,
            animated: true,
            style: { stroke: '#64748b', strokeDasharray: '5 5' },
          });
          g.setEdge(docNodeId, checkId);
        }
      });
    }
  });

  // Layer 4: Claim Nodes
  const claimNodeIds: string[] = [];
  claims.forEach((claim, idx) => {
    const claimNodeId = `claim_${claim.claim_id}`;
    claimNodeIds.push(claimNodeId);

    const node: GraphNode = {
      id: claimNodeId,
      type: 'claimNode',
      position: { x: 0, y: 0 },
      width: 250,
      height: 90,
      data: {
        id: claimNodeId,
        label: claim.claim_text,
        nodeType: 'claim',
        claimId: claim.claim_id,
        claimIndex: idx + 1,
        claimText: claim.claim_text,
        claimType: claim.claim_type,
        verdict: claim.verdict,
        confidence: claim.confidence,
        reason: claim.reason,
        ruleId: claim.rule_id,
      },
    };
    nodes.push(node);
    g.setNode(claimNodeId, { width: 250, height: 90 });

    // Edge from Check Node to Claim
    const cat = categorizeRuleId(claim.rule_id);
    const checkId = checkNodeIds.get(cat);
    if (checkId) {
      const verdictColor = getVerdictColor(claim.verdict);
      edges.push({
        id: `e_${checkId}_${claimNodeId}`,
        source: checkId,
        target: claimNodeId,
        animated: true,
        style: { stroke: verdictColor, strokeWidth: 2 },
        data: { verdict: claim.verdict, ruleId: claim.rule_id },
      });
      g.setEdge(checkId, claimNodeId);
    }

    // Direct edge from Passage to Claim (labelled with rule_id)
    if (claim.evidence && claim.evidence.length > 0) {
      claim.evidence.forEach((ev) => {
        const docId = ev.doc_id || 'document.pdf';
        const pKey = `${ev.page}_${(ev.passage_text || '').slice(0, 40).trim()}`;
        const pNodeId = passageNodeIdMap.get(`${docId}_${pKey}`);
        if (pNodeId) {
          edges.push({
            id: `e_${pNodeId}_${claimNodeId}_direct`,
            source: pNodeId,
            target: claimNodeId,
            label: claim.rule_id,
            animated: true,
            style: { stroke: getVerdictColor(claim.verdict), strokeWidth: 1.5, strokeDasharray: '4 4' },
            data: { verdict: claim.verdict, ruleId: claim.rule_id },
          });
          g.setEdge(pNodeId, claimNodeId);
        }
      });
    }
  });

  // Layer 5: Overall Summary Node
  const totalClaims = claims.length;
  const trustScore = totalClaims > 0 ? Math.round(((supportedCount + needsReviewCount * 0.4) / totalClaims) * 100) : 0;
  const overallId = 'overall_root';

  const overallNode: GraphNode = {
    id: overallId,
    type: 'overallNode',
    position: { x: 0, y: 0 },
    width: 230,
    height: 110,
    data: {
      id: overallId,
      label: 'Trace Grounding & Trust Index',
      nodeType: 'overall',
      stats: {
        total: totalClaims,
        supported: supportedCount,
        contradicted: contradictedCount,
        unsupported: unsupportedCount,
        needsReview: needsReviewCount,
        trustScore,
      },
    },
  };
  nodes.push(overallNode);
  g.setNode(overallId, { width: 230, height: 110 });

  // Connect all Claim nodes to Overall node
  claimNodeIds.forEach((cId, idx) => {
    const claimObj = claims[idx];
    const vColor = claimObj ? getVerdictColor(claimObj.verdict) : '#64748b';
    edges.push({
      id: `e_${cId}_${overallId}`,
      source: cId,
      target: overallId,
      animated: true,
      style: { stroke: vColor, strokeWidth: 2 },
      data: { verdict: claimObj?.verdict },
    });
    g.setEdge(cId, overallId);
  });

  // Run Dagre Layout
  dagre.layout(g);

  // Apply computed positions back to nodes
  nodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      // Dagre positions are center coordinates; convert to top-left for React Flow
      const w = node.width || 200;
      const h = node.height || 80;
      node.position = {
        x: Math.round(dagreNode.x - w / 2),
        y: Math.round(dagreNode.y - h / 2),
      };
    }
  });

  return {
    nodes,
    edges,
    metadata: {
      totalDocuments: docMap.size,
      totalPassages: totalPassageCount,
      totalChecks: checkNodeIds.size,
      totalClaims,
      trustScore,
    },
  };
}

export function getVerdictColor(verdict?: Verdict): string {
  switch (verdict) {
    case 'SUPPORTED':
      return '#22c55e'; // Green
    case 'CONTRADICTED':
      return '#ef4444'; // Red
    case 'UNSUPPORTED':
      return '#f59e0b'; // Amber
    case 'NEEDS_REVIEW':
      return '#a855f7'; // Purple
    default:
      return '#94a3b8'; // Slate
  }
}

/**
 * Finds all upstream node IDs and edge IDs starting from a given node.
 * Upstream path: target <- source (following directed incoming edges)
 */
export function getUpstreamPath(targetNodeId: string, edges: GraphEdge[]): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set<string>([targetNodeId]);
  const edgeIds = new Set<string>();

  // Queue of nodes to traverse backwards
  const queue: string[] = [targetNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    // Find all edges where target === currentId
    edges.forEach((edge) => {
      if (edge.target === currentId) {
        edgeIds.add(edge.id);
        if (!nodeIds.has(edge.source)) {
          nodeIds.add(edge.source);
          queue.push(edge.source);
        }
      }
    });
  }

  return { nodeIds, edgeIds };
}
