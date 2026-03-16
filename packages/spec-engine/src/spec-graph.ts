/**
 * Spec Graph: Extract nodes and edges from specification_with_ids
 * Source of Truth: docs/spec_graph_rules.md, docs/id_assignment_policy.md
 */

export interface SpecNode {
  nodeCode: string;
  nodeType: "REQ" | "UI" | "API" | "DB" | "TEST";
  title: string;
  content: string;
}

export interface SpecEdge {
  fromNodeCode: string;
  toNodeCode: string;
  relationType: string;
}

const NODE_PATTERNS: Record<string, RegExp> = {
  REQ: /###\s+(REQ-\d{3})\s*[:\-–]\s*(.+)/g,
  UI: /###\s+(UI-\d{3})\s*[:\-–]\s*(.+)/g,
  API: /###\s+(API-\d{3})\s*[:\-–]\s*(.+)/g,
  DB: /###\s+(DB-\d{3})\s*[:\-–]\s*(.+)/g,
  TEST: /###\s+(TEST-\d{3})\s*[:\-–]\s*(.+)/g,
};

/**
 * Extract nodes from specification markdown.
 */
export function extractNodes(specContent: string): SpecNode[] {
  const nodes: SpecNode[] = [];
  const seen = new Set<string>();

  for (const [nodeType, pattern] of Object.entries(NODE_PATTERNS)) {
    const regex = new RegExp(pattern.source, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(specContent)) !== null) {
      const nodeCode = match[1];
      if (seen.has(nodeCode)) continue;
      seen.add(nodeCode);

      // Extract content until next heading of same or higher level
      const startIdx = match.index + match[0].length;
      const nextHeading = specContent.indexOf("\n##", startIdx);
      const content = nextHeading === -1
        ? specContent.slice(startIdx).trim()
        : specContent.slice(startIdx, nextHeading).trim();

      nodes.push({
        nodeCode,
        nodeType: nodeType as SpecNode["nodeType"],
        title: match[2].trim(),
        content: content.slice(0, 1000), // Truncate for storage
      });
    }
  }

  return nodes;
}

/**
 * Extract edges by rule-based linking.
 * Supported edges per docs/spec_graph_rules.md:
 * - REQ → UI
 * - REQ → API
 * - API → DB
 * - REQ → TEST
 */
export function extractEdges(specContent: string, nodes: SpecNode[]): SpecEdge[] {
  const edges: SpecEdge[] = [];
  const seen = new Set<string>();
  const nodesByCode = new Map(nodes.map((n) => [n.nodeCode, n]));

  // Look for Links/references in content
  const linkPattern = /(REQ|UI|API|DB|TEST)-\d{3}/g;

  for (const node of nodes) {
    const fullText = node.content;
    let linkMatch: RegExpExecArray | null;
    const linkRegex = new RegExp(linkPattern.source, "g");

    while ((linkMatch = linkRegex.exec(fullText)) !== null) {
      const targetCode = linkMatch[0];
      if (targetCode === node.nodeCode) continue;
      if (!nodesByCode.has(targetCode)) continue;

      const targetNode = nodesByCode.get(targetCode)!;
      const relationType = getRelationType(node.nodeType, targetNode.nodeType);
      if (!relationType) continue;

      const edgeKey = `${node.nodeCode}->${targetCode}:${relationType}`;
      if (seen.has(edgeKey)) continue;
      seen.add(edgeKey);

      edges.push({
        fromNodeCode: node.nodeCode,
        toNodeCode: targetCode,
        relationType,
      });
    }
  }

  return edges;
}

function getRelationType(
  fromType: SpecNode["nodeType"],
  toType: SpecNode["nodeType"],
): string | null {
  if (fromType === "REQ" && toType === "UI") return "requires_ui";
  if (fromType === "REQ" && toType === "API") return "requires_api";
  if (fromType === "API" && toType === "DB") return "uses_db";
  if (fromType === "REQ" && toType === "TEST") return "tested_by";
  return null;
}
