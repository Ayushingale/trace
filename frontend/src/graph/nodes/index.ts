import { DocumentNode } from './DocumentNode';
import { PassageNode } from './PassageNode';
import { CheckNode } from './CheckNode';
import { ClaimNode } from './ClaimNode';
import { OverallNode } from './OverallNode';
import { CollapsedPassagesNode } from './CollapsedPassagesNode';

export const nodeTypes = {
  documentNode: DocumentNode,
  passageNode: PassageNode,
  checkNode: CheckNode,
  claimNode: ClaimNode,
  overallNode: OverallNode,
  collapsedPassagesNode: CollapsedPassagesNode,
};
