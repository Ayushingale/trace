import { describe, it, expect } from 'vitest';
import { buildGraph, categorizeRuleId, getUpstreamPath } from './buildGraph';
import { Claim } from '../api/types';
import mockClaimsRaw from '../mocks/claims.json';

const mockClaims = mockClaimsRaw as Claim[];

describe('buildGraph Pure Function', () => {
  it('handles empty claims array gracefully', () => {
    const result = buildGraph([]);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.metadata.totalClaims).toBe(0);
    expect(result.metadata.trustScore).toBe(0);
  });

  it('correctly categorizes rule IDs into check categories', () => {
    expect(categorizeRuleId('dur.exact_match')).toBe('deterministic');
    expect(categorizeRuleId('num.unit_mismatch')).toBe('deterministic');
    expect(categorizeRuleId('date.range_check')).toBe('deterministic');
    expect(categorizeRuleId('mod.permissive_match')).toBe('deterministic');
    expect(categorizeRuleId('neg.negation_flip')).toBe('deterministic');
    expect(categorizeRuleId('ent.missing_corroboration')).toBe('deterministic');
    expect(categorizeRuleId('nli.entailment')).toBe('nli');
    expect(categorizeRuleId('judge.reasoning')).toBe('judge');
    expect(categorizeRuleId('combiner.abstain')).toBe('combiner');
    expect(categorizeRuleId(undefined)).toBe('combiner');
  });

  it('derives a complete 5-layer graph from mock claims', () => {
    const result = buildGraph(mockClaims);

    // Layer 1: Documents
    const docNodes = result.nodes.filter((n) => n.data.nodeType === 'document');
    expect(docNodes.length).toBeGreaterThanOrEqual(1);
    expect(docNodes[0].data.label).toContain('master_agreement.pdf');

    // Layer 2: Passages
    const passageNodes = result.nodes.filter((n) => n.data.nodeType === 'passage');
    expect(passageNodes.length).toBeGreaterThanOrEqual(3);
    expect(passageNodes[0].data.page).toBeDefined();

    // Layer 3: Checks
    const checkNodes = result.nodes.filter((n) => n.data.nodeType === 'check');
    expect(checkNodes.length).toBeGreaterThanOrEqual(2); // At least deterministic and combiner for the mock
    const checkCategories = checkNodes.map((n) => n.data.checkCategory);
    expect(checkCategories).toContain('deterministic');
    expect(checkCategories).toContain('combiner');

    // Layer 4: Claims
    const claimNodes = result.nodes.filter((n) => n.data.nodeType === 'claim');
    expect(claimNodes).toHaveLength(mockClaims.length);
    expect(claimNodes[0].data.claimId).toBe('c_001');
    expect(claimNodes[0].data.verdict).toBe('SUPPORTED');

    // Layer 5: Overall summary node
    const overallNodes = result.nodes.filter((n) => n.data.nodeType === 'overall');
    expect(overallNodes).toHaveLength(1);
    expect(overallNodes[0].data.stats?.total).toBe(mockClaims.length);
    expect(overallNodes[0].data.stats?.supported).toBe(2);
    expect(overallNodes[0].data.stats?.contradicted).toBe(1);
    expect(overallNodes[0].data.stats?.unsupported).toBe(1);
    expect(overallNodes[0].data.stats?.needsReview).toBe(1);

    // Edges
    expect(result.edges.length).toBeGreaterThan(10);

    // Validate Dagre positioned all nodes with valid coordinates
    result.nodes.forEach((node) => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(node.position.x).toBeGreaterThanOrEqual(-100);
      expect(node.position.y).toBeGreaterThanOrEqual(-100);
    });
  });

  it('correctly identifies full upstream path for a claim', () => {
    const result = buildGraph(mockClaims);
    const targetClaimNodeId = 'claim_c_001';

    const { nodeIds, edgeIds } = getUpstreamPath(targetClaimNodeId, result.edges);

    expect(nodeIds.has(targetClaimNodeId)).toBe(true);
    expect(edgeIds.size).toBeGreaterThan(0);

    // c_001 is decided by deterministic check
    expect(nodeIds.has('check_deterministic')).toBe(true);

    // c_001 has evidence from master_agreement.pdf
    const docNode = result.nodes.find((n) => n.data.nodeType === 'document');
    expect(docNode).toBeDefined();
    expect(nodeIds.has(docNode!.id)).toBe(true);
  });
});
