import type { PrismaClient } from "@prisma/client";
import type { AiProvider } from "@spec-engine/engine";
import {
  checkConflicts,
  summarizeConflicts,
  calculateScore,
  extractNodes,
  extractEdges,
  createExportBundle,
  meetsGatingRequirements,
} from "@spec-engine/engine";
import { SCORING } from "@spec-engine/shared";
import type { ScoreCategoryMap } from "@spec-engine/shared";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

export class StepHandlers {
  private prisma: PrismaClient;
  private ai: AiProvider;

  constructor(prisma: PrismaClient, ai: AiProvider) {
    this.prisma = prisma;
    this.ai = ai;
  }

  /** Step 01: Intake - normalize and store raw inputs */
  async intake(projectId: string, runId: string, stepId: string): Promise<void> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { inputs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const input = project.inputs[0];
    if (!input) throw new Error("No project input found");

    // Store normalized intake artifact
    await this.upsertArtifact(projectId, "intake_raw", input.rawPrompt, "intake");
    await this.log(projectId, runId, "info", "step-01", `Intake completed for: ${project.title}`);
  }

  /** Step 02: Common Features Apply */
  async commonFeaturesApply(projectId: string, runId: string, stepId: string): Promise<void> {
    const features = await this.prisma.projectCommonFeature.findMany({
      where: { projectId, enabled: true },
      include: { commonFeature: true },
    });

    const featureList = features.map((f) => f.commonFeature.name).join(", ");
    const content = features.length > 0
      ? `Applied common features: ${featureList}`
      : "No common features selected";

    await this.upsertArtifact(projectId, "common_features_applied", content, "common_features");
    await this.log(projectId, runId, "info", "step-02", content);
  }

  /** Step 03: Requirements Generate */
  async requirementsGenerate(projectId: string, runId: string, stepId: string): Promise<void> {
    const intake = await this.getLatestArtifact(projectId, "intake_raw");
    const commonFeatures = await this.getLatestArtifact(projectId, "common_features_applied");

    const response = await this.ai.call({
      prompt: `requirements_generate\nINPUT:\n${intake}\nCOMMON_FEATURES:\n${commonFeatures}`,
      systemPrompt: "Generate structured requirements from the input.",
    });

    await this.upsertArtifact(projectId, "requirements_draft", response.content, "requirements");
    await this.log(projectId, runId, "info", "step-03", "Requirements generated");
  }

  /** Step 04-05: Requirements Polish */
  async requirementsPolish(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const isSecondPass = stepKey === "requirements_polish_2";
    const sourceType = isSecondPass ? "requirements_polished_1" : "requirements_draft";
    const targetType = isSecondPass ? "requirements_final" : "requirements_polished_1";

    const source = await this.getLatestArtifact(projectId, sourceType);

    const response = await this.ai.call({
      prompt: `requirements_polish\nINPUT:\n${source}`,
      systemPrompt: "Polish and clarify the requirements.",
    });

    await this.upsertArtifact(projectId, targetType, response.content, "requirements");
    await this.log(projectId, runId, "info", stepKey, `Requirements polished (${stepKey})`);
  }

  /** Step 06-07: Requirements Audit */
  async requirementsAudit(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const requirements = await this.getLatestArtifact(projectId, "requirements_final") ||
      await this.getLatestArtifact(projectId, "requirements_polished_1") ||
      await this.getLatestArtifact(projectId, "requirements_draft");

    const response = await this.ai.call({
      prompt: `requirements_audit\nINPUT:\n${requirements}`,
      systemPrompt: "Audit the requirements for completeness and correctness.",
    });

    const auditNum = stepKey === "requirements_audit_1" ? 1 : 2;
    await this.upsertArtifact(projectId, `requirements_audit_${auditNum}`, response.content, "audit");
    await this.log(projectId, runId, "info", stepKey, `Requirements audit ${auditNum} completed`);
  }

  /** Step 08: Specification Generate */
  async specificationGenerate(projectId: string, runId: string, stepId: string): Promise<void> {
    const requirements = await this.getLatestArtifact(projectId, "requirements_final");
    const commonFeatures = await this.getLatestArtifact(projectId, "common_features_applied");

    const response = await this.ai.call({
      prompt: `specification_generate\nREQUIREMENTS:\n${requirements}\nCOMMON_FEATURES:\n${commonFeatures}`,
      systemPrompt: "Generate a comprehensive specification document with 27 sections.",
    });

    await this.upsertArtifact(projectId, "specification_draft", response.content, "specification");
    await this.log(projectId, runId, "info", "step-08", "Specification generated");
  }

  /** Step 09-10: Specification Polish */
  async specificationPolish(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const isSecondPass = stepKey === "specification_polish_2";
    const sourceType = isSecondPass ? "specification_polished_1" : "specification_draft";
    const targetType = isSecondPass ? "specification_final" : "specification_polished_1";

    const source = await this.getLatestArtifact(projectId, sourceType);

    const response = await this.ai.call({
      prompt: `specification_polish\nINPUT:\n${source}`,
      systemPrompt: "Polish and refine the specification.",
    });

    await this.upsertArtifact(projectId, targetType, response.content, "specification");
    await this.log(projectId, runId, "info", stepKey, `Specification polished (${stepKey})`);
  }

  /** Step 11-12: Specification Audit */
  async specificationAudit(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    const response = await this.ai.call({
      prompt: `specification_audit\nINPUT:\n${spec}`,
      systemPrompt: "Audit the specification for completeness, consistency, and correctness.",
    });

    const auditNum = stepKey === "specification_audit_1" ? 1 : 2;
    await this.upsertArtifact(projectId, `specification_audit_${auditNum}`, response.content, "audit");
    await this.log(projectId, runId, "info", stepKey, `Specification audit ${auditNum} completed`);
  }

  /** Step 13: Specification ID Assign */
  async specificationIdAssign(
    projectId: string,
    runId: string,
    stepId: string,
    loopIteration: number,
  ): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    // Extract nodes and edges
    const nodes = extractNodes(spec);
    const edges = extractEdges(spec, nodes);

    // UPSERT nodes
    for (const node of nodes) {
      await this.prisma.specificationNode.upsert({
        where: {
          projectId_nodeCode: { projectId, nodeCode: node.nodeCode },
        },
        create: {
          projectId,
          nodeCode: node.nodeCode,
          nodeType: node.nodeType,
          title: node.title,
          content: node.content,
        },
        update: {
          title: node.title,
          content: node.content,
        },
      });
    }

    // Get node IDs for edge creation
    const dbNodes = await this.prisma.specificationNode.findMany({
      where: { projectId },
    });
    const nodeMap = new Map(dbNodes.map((n) => [n.nodeCode, n.id]));

    // UPSERT edges
    for (const edge of edges) {
      const fromNodeId = nodeMap.get(edge.fromNodeCode);
      const toNodeId = nodeMap.get(edge.toNodeCode);
      if (!fromNodeId || !toNodeId) continue;

      await this.prisma.specificationEdge.upsert({
        where: {
          projectId_fromNodeId_toNodeId_relationType: {
            projectId,
            fromNodeId,
            toNodeId,
            relationType: edge.relationType,
          },
        },
        create: {
          projectId,
          fromNodeId,
          toNodeId,
          relationType: edge.relationType,
        },
        update: {},
      });
    }

    const withIds = `${spec}\n\n<!-- Nodes: ${nodes.length}, Edges: ${edges.length} -->`;
    await this.upsertArtifact(projectId, "specification_with_ids", withIds, "specification");
    await this.log(projectId, runId, "info", "step-13",
      `ID assignment: ${nodes.length} nodes, ${edges.length} edges`);
  }

  /** Step 14: Conflict Check */
  async conflictCheck(
    projectId: string,
    runId: string,
    stepId: string,
    loopIteration: number,
  ): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");
    const conflicts = checkConflicts(spec);
    const summary = summarizeConflicts(conflicts);

    // Store conflicts in DB
    for (const conflict of conflicts) {
      await this.prisma.specificationConflict.upsert({
        where: {
          projectId_workflowRunId_loopIteration_conflictCode_description: {
            projectId,
            workflowRunId: runId,
            loopIteration,
            conflictCode: conflict.conflictCode,
            description: conflict.description,
          },
        },
        create: {
          projectId,
          workflowRunId: runId,
          loopIteration,
          conflictCode: conflict.conflictCode,
          severity: conflict.severity,
          description: conflict.description,
        },
        update: {
          severity: conflict.severity,
        },
      });
    }

    const reportContent = JSON.stringify({ conflicts, summary }, null, 2);
    await this.upsertArtifact(projectId, "conflict_report", reportContent, "validation");
    await this.log(projectId, runId, "info", "step-14",
      `Conflict check: critical=${summary.critical}, major=${summary.major}, minor=${summary.minor}`);
  }

  /** Step 15: Spec Score */
  async specScore(
    projectId: string,
    runId: string,
    stepId: string,
    loopIteration: number,
  ): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    // In mock mode, generate deterministic scores
    const categories: ScoreCategoryMap = {
      completeness: this.mockCategoryScore(spec, "completeness"),
      clarity: this.mockCategoryScore(spec, "clarity"),
      implementability: this.mockCategoryScore(spec, "implementability"),
      bug_risk: this.mockCategoryScore(spec, "bug_risk"),
      consistency: this.mockCategoryScore(spec, "consistency"),
      traceability: this.mockCategoryScore(spec, "traceability"),
      testability: this.mockCategoryScore(spec, "testability"),
      extensibility: this.mockCategoryScore(spec, "extensibility"),
      operational_safety: this.mockCategoryScore(spec, "operational_safety"),
      ai_output_quality: this.mockCategoryScore(spec, "ai_output_quality"),
    };

    const result = calculateScore(categories);

    // Update project scores
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const scoreDelta = project.currentScore !== null ? result.total - project.currentScore : null;

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        lastScore: project.currentScore,
        currentScore: result.total,
        scoreDelta,
      },
    });

    const reportContent = JSON.stringify({
      total: result.total,
      categories: result.categories,
      weakCategories: result.weakCategories,
      loopIteration,
    }, null, 2);

    await this.upsertArtifact(projectId, "spec_score_report", reportContent, "scoring");
    await this.log(projectId, runId, "info", "step-15",
      `Score: ${result.total} (weak: ${result.weakCategories.join(", ") || "none"})`);
  }

  /** Step 16: Spec Test */
  async specTest(
    projectId: string,
    runId: string,
    stepId: string,
    loopIteration: number,
  ): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    // Mock test execution
    const testReport = {
      totalTests: 10,
      passed: 9,
      failed: 1,
      skipped: 0,
      testCases: [
        { name: "Structure validation", status: "passed" },
        { name: "Required sections present", status: "passed" },
        { name: "ID format compliance", status: "passed" },
        { name: "Cross-reference integrity", status: "passed" },
        { name: "Acceptance criteria present", status: "passed" },
        { name: "API completeness", status: "passed" },
        { name: "DB schema coverage", status: "passed" },
        { name: "Test case coverage", status: "passed" },
        { name: "UI flow continuity", status: "passed" },
        { name: "Security requirements", status: "failed" },
      ],
      loopIteration,
    };

    await this.upsertArtifact(projectId, "spec_test_report", JSON.stringify(testReport, null, 2), "testing");
    await this.log(projectId, runId, "info", "step-16",
      `Tests: ${testReport.passed}/${testReport.totalTests} passed`);
  }

  /** Step 17: Spec Feedback (improvement) */
  async specFeedback(
    projectId: string,
    runId: string,
    stepId: string,
    loopIteration: number,
  ): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");
    const scoreReport = await this.getLatestArtifact(projectId, "spec_score_report");
    const conflictReport = await this.getLatestArtifact(projectId, "conflict_report");
    const testReport = await this.getLatestArtifact(projectId, "spec_test_report");

    const response = await this.ai.call({
      prompt: `specification_improve\nSPEC:\n${spec}\nSCORE:\n${scoreReport}\nCONFLICTS:\n${conflictReport}\nTESTS:\n${testReport}`,
      systemPrompt: "Improve the specification based on weak scores, conflicts, and test failures.",
    });

    // Update specification_final with improved version
    await this.upsertArtifact(projectId, "specification_final", response.content, "specification");
    await this.log(projectId, runId, "info", "step-17", `Specification improved (iteration ${loopIteration})`);
  }

  /** Step 18: UI Navigation Diagram */
  async uiNavigationDiagram(projectId: string, runId: string, stepId: string): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    const response = await this.ai.call({
      prompt: `ui_navigation_diagram\nSPEC:\n${spec}`,
      systemPrompt: "Generate a Mermaid flowchart for UI navigation.",
    });

    // Store Mermaid source
    await this.upsertArtifact(projectId, "ui_navigation_diagram_mermaid", response.content, "diagram");

    // For now, store mermaid as "png" placeholder
    // In production, would use mermaid-cli to render to PNG
    await this.upsertArtifact(projectId, "ui_navigation_diagram_png", response.content, "diagram");

    await this.log(projectId, runId, "info", "step-18", "UI navigation diagram generated");
  }

  /** Step 19: Export Spec */
  async exportSpec(projectId: string, runId: string, stepId: string): Promise<void> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Collect all artifacts for export
    const artifacts = [];

    const requirementsFinal = await this.getLatestArtifact(projectId, "requirements_final");
    if (requirementsFinal) {
      artifacts.push({ filename: "requirements_final.md", content: requirementsFinal });
    }

    const specFinal = await this.getLatestArtifact(projectId, "specification_final");
    if (specFinal) {
      artifacts.push({ filename: "specification_final.md", content: specFinal });
    }

    const conflictReport = await this.getLatestArtifact(projectId, "conflict_report");
    if (conflictReport) {
      artifacts.push({ filename: "conflict_report.json", content: conflictReport });
    }

    const scoreReport = await this.getLatestArtifact(projectId, "spec_score_report");
    if (scoreReport) {
      artifacts.push({ filename: "spec_score_report.json", content: scoreReport });
    }

    const testReport = await this.getLatestArtifact(projectId, "spec_test_report");
    if (testReport) {
      artifacts.push({ filename: "spec_test_report.json", content: testReport });
    }

    const uiDiagram = await this.getLatestArtifact(projectId, "ui_navigation_diagram_mermaid");
    if (uiDiagram) {
      artifacts.push({ filename: "ui_navigation_diagram.mmd", content: uiDiagram });
    }

    const uiPng = await this.getLatestArtifact(projectId, "ui_navigation_diagram_png");
    if (uiPng) {
      artifacts.push({ filename: "ui_navigation_diagram.png", content: uiPng });
    }

    // Create export directory
    const exportDir = join(process.cwd(), "tmp", "exports");
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const zipPath = join(exportDir, `${project.projectCode}_spec_bundle.zip`);
    await createExportBundle(artifacts, zipPath);

    await this.upsertArtifact(projectId, "export_bundle", zipPath, "export");
    await this.log(projectId, runId, "info", "step-19",
      `Export bundle created: ${artifacts.length} files`);
  }

  /** Step 20: Devin Gate */
  async devinGate(projectId: string, runId: string, stepId: string): Promise<void> {
    const scoreArtifact = await this.getLatestArtifact(projectId, "spec_score_report");
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    let readyForDevin = false;
    let gateDetails = "";

    if (scoreArtifact) {
      try {
        const parsed = JSON.parse(scoreArtifact);
        const scoreResult = calculateScore(parsed.categories as ScoreCategoryMap);
        const criticalConflicts = await this.prisma.specificationConflict.count({
          where: { projectId, severity: "critical" },
        });
        const hasAcceptance = spec.includes("Acceptance Criteria") || spec.includes("受入条件");

        readyForDevin = meetsGatingRequirements(scoreResult, criticalConflicts, hasAcceptance);

        gateDetails = JSON.stringify({
          score: scoreResult.total,
          targetScore: SCORING.targetScore,
          criticalConflicts,
          weakCategories: scoreResult.weakCategories,
          hasAcceptanceCriteria: hasAcceptance,
          readyForDevin,
        }, null, 2);
      } catch {
        gateDetails = JSON.stringify({ error: "Failed to evaluate gate", readyForDevin: false });
      }
    }

    await this.upsertArtifact(projectId, "devin_gate_report", gateDetails, "gate");

    await this.prisma.projectOutput.upsert({
      where: { projectId },
      create: { projectId, readyForDevin },
      update: { readyForDevin },
    });

    await this.log(projectId, runId, "info", "step-20",
      `Devin gate: readyForDevin=${readyForDevin}`);
  }

  // --- Helper Methods ---

  private async getLatestArtifact(projectId: string, artifactType: string): Promise<string> {
    const artifact = await this.prisma.artifact.findFirst({
      where: { projectId, artifactType },
      orderBy: { versionNo: "desc" },
    });
    return artifact?.content ?? "";
  }

  private async upsertArtifact(
    projectId: string,
    artifactType: string,
    content: string,
    title: string,
  ): Promise<void> {
    const existing = await this.prisma.artifact.findFirst({
      where: { projectId, artifactType },
      orderBy: { versionNo: "desc" },
    });

    const versionNo = existing ? existing.versionNo + 1 : 1;
    const storagePath = `artifacts/${projectId}/${artifactType}_v${versionNo}`;

    await this.prisma.artifact.create({
      data: {
        projectId,
        artifactType,
        versionNo,
        title,
        storagePath,
        content,
        status: "active",
      },
    });
  }

  private mockCategoryScore(spec: string, category: string): number {
    // Deterministic mock scores based on spec content length and category
    const baseScore = 85;
    const variation = (spec.length + category.length) % 15;
    return Math.min(100, baseScore + variation);
  }

  private async log(
    projectId: string,
    runId: string,
    logLevel: string,
    source: string,
    message: string,
  ): Promise<void> {
    const run = await this.prisma.workflowRun.findUnique({ where: { id: runId } });
    if (run) {
      await this.prisma.workflowLog.create({
        data: { projectId, workflowRunId: runId, logLevel, source, message },
      });
    }
  }
}
