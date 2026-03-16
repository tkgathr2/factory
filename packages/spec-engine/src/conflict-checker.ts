/**
 * Conflict checker based on validation/rules.yml and validation/dsl_spec.md
 */

export interface ConflictRule {
  id: string;
  severity: "critical" | "major" | "minor";
  condition: string;
  message: string;
}

export interface Conflict {
  conflictCode: string;
  severity: "critical" | "major" | "minor";
  description: string;
}

/**
 * Default conflict rules derived from validation/rules.yml
 */
export const DEFAULT_RULES: ConflictRule[] = [
  {
    id: "api_missing_definition",
    severity: "critical",
    condition: "spec has API-NNN reference but no definition in API section",
    message: "API endpoint referenced but not defined",
  },
  {
    id: "scope_conflict",
    severity: "major",
    condition: "overlapping scope definitions detected",
    message: "Overlapping scope definitions found",
  },
  {
    id: "acceptance_missing",
    severity: "critical",
    condition: "specification missing acceptance criteria section",
    message: "Acceptance criteria section is missing or empty",
  },
  {
    id: "db_schema_mismatch",
    severity: "major",
    condition: "DB-NNN reference does not match schema definition",
    message: "Database schema reference mismatch",
  },
  {
    id: "ui_flow_gap",
    severity: "minor",
    condition: "UI-NNN navigation path has unreachable screen",
    message: "Unreachable UI screen detected",
  },
  {
    id: "test_coverage_gap",
    severity: "minor",
    condition: "REQ-NNN has no linked TEST-NNN",
    message: "Requirement has no linked test case",
  },
];

/**
 * Run conflict checks against a specification document.
 * In mock mode, returns simulated conflicts.
 * In live mode, would parse the spec and evaluate rules.
 */
export function checkConflicts(
  specificationContent: string,
  rules: ConflictRule[] = DEFAULT_RULES,
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const rule of rules) {
    switch (rule.id) {
      case "api_missing_definition": {
        const apiRefs = specificationContent.match(/API-\d{3}/g) || [];
        const apiDefs = specificationContent.match(/### API-\d{3}/g) || [];
        const definedApis = new Set(apiDefs.map((d) => d.replace("### ", "")));
        for (const ref of apiRefs) {
          if (!definedApis.has(ref)) {
            conflicts.push({
              conflictCode: rule.id,
              severity: rule.severity,
              description: `${rule.message}: ${ref}`,
            });
          }
        }
        break;
      }
      case "acceptance_missing": {
        if (
          !specificationContent.includes("## Acceptance Criteria") &&
          !specificationContent.includes("## 受入条件")
        ) {
          conflicts.push({
            conflictCode: rule.id,
            severity: rule.severity,
            description: rule.message,
          });
        }
        break;
      }
      case "test_coverage_gap": {
        const reqIds = specificationContent.match(/REQ-\d{3}/g) || [];
        const testLinks = specificationContent.match(/TEST-\d{3}.*REQ-\d{3}/g) || [];
        const linkedReqs = new Set(
          testLinks.map((l) => {
            const match = l.match(/REQ-\d{3}/);
            return match ? match[0] : "";
          }),
        );
        for (const req of new Set(reqIds)) {
          if (!linkedReqs.has(req)) {
            conflicts.push({
              conflictCode: rule.id,
              severity: rule.severity,
              description: `${rule.message}: ${req}`,
            });
          }
        }
        break;
      }
      default:
        // Other rules require deeper analysis - skip in basic mode
        break;
    }
  }

  return conflicts;
}

export function summarizeConflicts(conflicts: Conflict[]): {
  critical: number;
  major: number;
  minor: number;
} {
  return {
    critical: conflicts.filter((c) => c.severity === "critical").length,
    major: conflicts.filter((c) => c.severity === "major").length,
    minor: conflicts.filter((c) => c.severity === "minor").length,
  };
}
