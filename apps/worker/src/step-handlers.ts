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
    if (!input) throw new Error("プロジェクト入力が見つかりません");

    // Store normalized intake artifact
    await this.upsertArtifact(projectId, "intake_raw", input.rawPrompt, "intake");
    await this.log(projectId, runId, "info", "step-01", `要件取込完了: ${project.title}`);
  }

  /** Step 02: Common Features Apply */
  async commonFeaturesApply(projectId: string, runId: string, stepId: string): Promise<void> {
    const features = await this.prisma.projectCommonFeature.findMany({
      where: { projectId, enabled: true },
      include: { commonFeature: true },
    });

    const featureList = features.map((f) => f.commonFeature.name).join(", ");
    const content = features.length > 0
      ? `共通機能を適用: ${featureList}`
      : "共通機能が選択されていません";

    await this.upsertArtifact(projectId, "common_features_applied", content, "common_features");
    await this.log(projectId, runId, "info", "step-02", content);
  }

  /** Step 03: Requirements Generate */
  async requirementsGenerate(projectId: string, runId: string, stepId: string): Promise<void> {
    const intake = await this.getLatestArtifact(projectId, "intake_raw");
    const commonFeatures = await this.getLatestArtifact(projectId, "common_features_applied");

    const response = await this.ai.call({
      prompt: `requirements_generate\nINPUT:\n${intake}\nCOMMON_FEATURES:\n${commonFeatures}`,
      systemPrompt: "入力から構造化された要件を生成してください。",
    });

    await this.upsertArtifact(projectId, "requirements_draft", response.content, "requirements");
    await this.log(projectId, runId, "info", "step-03", "要件生成完了");
  }

  /** Step 04-05: Requirements Polish */
  async requirementsPolish(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const isSecondPass = stepKey === "requirements_polish_2";
    const sourceType = isSecondPass ? "requirements_polished_1" : "requirements_draft";
    const targetType = isSecondPass ? "requirements_final" : "requirements_polished_1";

    const source = await this.getLatestArtifact(projectId, sourceType);

    const response = await this.ai.call({
      prompt: `requirements_polish\nINPUT:\n${source}`,
      systemPrompt: "要件を磨き上げて明確化してください。",
    });

    await this.upsertArtifact(projectId, targetType, response.content, "requirements");
    await this.log(projectId, runId, "info", stepKey, `要件磨き上げ完了 (${stepKey})`);
  }

  /** Step 06-07: Requirements Audit */
  async requirementsAudit(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const requirements = await this.getLatestArtifact(projectId, "requirements_final") ||
      await this.getLatestArtifact(projectId, "requirements_polished_1") ||
      await this.getLatestArtifact(projectId, "requirements_draft");

    const response = await this.ai.call({
      prompt: `requirements_audit\nINPUT:\n${requirements}`,
      systemPrompt: "要件の完全性と正確性を監査してください。",
    });

    const auditNum = stepKey === "requirements_audit_1" ? 1 : 2;
    await this.upsertArtifact(projectId, `requirements_audit_${auditNum}`, response.content, "audit");
    await this.log(projectId, runId, "info", stepKey, `要件監査${auditNum}完了`);
  }

  /** Step 08: Specification Generate */
  async specificationGenerate(projectId: string, runId: string, stepId: string): Promise<void> {
    const requirements = await this.getLatestArtifact(projectId, "requirements_final");
    const commonFeatures = await this.getLatestArtifact(projectId, "common_features_applied");

    const response = await this.ai.call({
      prompt: `specification_generate\nREQUIREMENTS:\n${requirements}\nCOMMON_FEATURES:\n${commonFeatures}`,
      systemPrompt: "27セクションの包括的な仕様書を生成してください。",
    });

    await this.upsertArtifact(projectId, "specification_draft", response.content, "specification");
    await this.log(projectId, runId, "info", "step-08", "仕様書生成完了");
  }

  /** Step 09-10: Specification Polish */
  async specificationPolish(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const isSecondPass = stepKey === "specification_polish_2";
    const sourceType = isSecondPass ? "specification_polished_1" : "specification_draft";
    const targetType = isSecondPass ? "specification_final" : "specification_polished_1";

    const source = await this.getLatestArtifact(projectId, sourceType);

    const response = await this.ai.call({
      prompt: `specification_polish\nINPUT:\n${source}`,
      systemPrompt: "仕様書を磨き上げて精練してください。",
    });

    await this.upsertArtifact(projectId, targetType, response.content, "specification");
    await this.log(projectId, runId, "info", stepKey, `仕様書磨き上げ完了 (${stepKey})`);
  }

  /** Step 11-12: Specification Audit */
  async specificationAudit(projectId: string, runId: string, stepId: string, stepKey: string): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    const response = await this.ai.call({
      prompt: `specification_audit\nINPUT:\n${spec}`,
      systemPrompt: "仕様書の完全性、整合性、正確性を監査してください。",
    });

    const auditNum = stepKey === "specification_audit_1" ? 1 : 2;
    await this.upsertArtifact(projectId, `specification_audit_${auditNum}`, response.content, "audit");
    await this.log(projectId, runId, "info", stepKey, `仕様書監査${auditNum}完了`);
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
          nodeType: node.nodeType,
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
      `ID付与: ${nodes.length}ノード, ${edges.length}エッジ`);
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
      `矛盾検出: 重大=${summary.critical}, 主要=${summary.major}, 軽微=${summary.minor}`);
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
      `スコア: ${result.total} (弱点: ${result.weakCategories.join(", ") || "なし"})`);
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
        { name: "構造検証", status: "passed" },
        { name: "必須セクション存在確認", status: "passed" },
        { name: "IDフォーマット準拠", status: "passed" },
        { name: "相互参照整合性", status: "passed" },
        { name: "受入条件存在確認", status: "passed" },
        { name: "API完全性", status: "passed" },
        { name: "DBスキーマカバレッジ", status: "passed" },
        { name: "テストケースカバレッジ", status: "passed" },
        { name: "UIフロー連続性", status: "passed" },
        { name: "セキュリティ要件", status: "failed" },
      ],
      loopIteration,
    };

    await this.upsertArtifact(projectId, "spec_test_report", JSON.stringify(testReport, null, 2), "testing");
    await this.log(projectId, runId, "info", "step-16",
      `テスト: ${testReport.passed}/${testReport.totalTests}件合格`);
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
      systemPrompt: "弱点スコア、矛盾、テスト失敗に基づいて仕様書を改善してください。",
    });

    // Update specification_final with improved version
    await this.upsertArtifact(projectId, "specification_final", response.content, "specification");
    await this.log(projectId, runId, "info", "step-17", `仕様書改善完了（イテレーション ${loopIteration}）`);
  }

  /** Step 18: UI Navigation Diagram */
  async uiNavigationDiagram(projectId: string, runId: string, stepId: string): Promise<void> {
    const spec = await this.getLatestArtifact(projectId, "specification_final");

    const response = await this.ai.call({
      prompt: `ui_navigation_diagram\nSPEC:\n${spec}`,
      systemPrompt: "UI画面遷移のMermaidフローチャートを生成してください。",
    });

    // Store Mermaid source
    await this.upsertArtifact(projectId, "ui_navigation_diagram_mermaid", response.content, "diagram");

    // For now, store mermaid as "png" placeholder
    // In production, would use mermaid-cli to render to PNG
    await this.upsertArtifact(projectId, "ui_navigation_diagram_png", response.content, "diagram");

    await this.log(projectId, runId, "info", "step-18", "UI画面遷移図生成完了");
  }

  /** Step 19: Export Spec */
  async exportSpec(projectId: string, runId: string, stepId: string): Promise<void> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Collect all artifacts for export (fetch in parallel)
    const artifactDefs = [
      { type: "requirements_final", filename: "requirements_final.md" },
      { type: "specification_final", filename: "specification_final.md" },
      { type: "conflict_report", filename: "conflict_report.json" },
      { type: "spec_score_report", filename: "spec_score_report.json" },
      { type: "spec_test_report", filename: "spec_test_report.json" },
      { type: "ui_navigation_diagram_mermaid", filename: "ui_navigation_diagram.mmd" },
      { type: "ui_navigation_diagram_png", filename: "ui_navigation_diagram.png" },
    ];

    const fetched = await Promise.all(
      artifactDefs.map((d) => this.getLatestArtifact(projectId, d.type)),
    );

    const artifacts = artifactDefs
      .map((d, i) => ({ filename: d.filename, content: fetched[i] }))
      .filter((a) => a.content);

    // Create export directory
    const exportDir = join(process.cwd(), "tmp", "exports");
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const zipPath = join(exportDir, `${project.projectCode}_spec_bundle.zip`);
    await createExportBundle(artifacts, zipPath);

    await this.upsertArtifact(projectId, "export_bundle", zipPath, "export");
    await this.log(projectId, runId, "info", "step-19",
      `エクスポートバンドル作成: ${artifacts.length}ファイル`);
  }

  /** Step 20: Devin Gate */
  async devinGate(projectId: string, runId: string, stepId: string): Promise<void> {
    const [scoreArtifact, spec] = await Promise.all([
      this.getLatestArtifact(projectId, "spec_score_report"),
      this.getLatestArtifact(projectId, "specification_final"),
    ]);

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
        gateDetails = JSON.stringify({ error: "ゲート評価に失敗", readyForDevin: false });
      }
    }

    await Promise.all([
      this.upsertArtifact(projectId, "devin_gate_report", gateDetails, "gate"),
      this.prisma.projectOutput.upsert({
        where: { projectId },
        create: { projectId, readyForDevin },
        update: { readyForDevin },
      }),
    ]);

    await this.log(projectId, runId, "info", "step-20",
      `Devinゲート: readyForDevin=${readyForDevin}`);
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
    // Skip redundant findUnique check - runId is always valid when called
    await this.prisma.workflowLog.create({
      data: { projectId, workflowRunId: runId, logLevel, source, message },
    });
  }
}
