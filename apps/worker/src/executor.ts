import type { PrismaClient } from "@prisma/client";
import {
  WORKFLOW_STEPS,
  LOOP_START_STEP,
  LOOP_END_STEP,
  getStepByOrder,
} from "@spec-engine/shared";
import {
  calculateProgress,
  createAiProvider,
  calculateScore,
  meetsGatingRequirements,
  checkConflicts,
  summarizeConflicts,
  evaluateLoop,
  extractNodes,
  extractEdges,
  createExportBundle,
} from "@spec-engine/engine";
import type { AiProvider } from "@spec-engine/engine";
import type { ScoreCategoryMap } from "@spec-engine/shared";
import { StepHandlers } from "./step-handlers";

export class WorkflowExecutor {
  private prisma: PrismaClient;
  private aiProvider: AiProvider;
  private handlers: StepHandlers;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.aiProvider = createAiProvider();
    this.handlers = new StepHandlers(prisma, this.aiProvider);
  }

  async execute(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { inputs: true },
    });

    if (!project) throw new Error(`Project ${projectId} not found`);

    // Get or create workflow run
    let run = await this.prisma.workflowRun.findFirst({
      where: { projectId, status: { in: ["queued", "running"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!run) {
      run = await this.prisma.workflowRun.create({
        data: { projectId, status: "queued" },
      });
    }

    // Transition to running
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: "running" },
    });
    await this.prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "running", startedAt: new Date() },
    });

    // Determine start step (resume from checkpoint or start from 1)
    let startStep = 1;
    if (project.checkpointStepOrder) {
      startStep = project.checkpointStepOrder + 1;
    }

    const runStartTime = Date.now();

    try {
      let currentStep = startStep;

      while (currentStep <= 20) {
        // Check for manual stop
        const freshProject = await this.prisma.project.findUnique({
          where: { id: projectId },
        });
        if (freshProject?.manualStopRequested) {
          await this.log(projectId, run.id, "info", "executor", "手動停止が要求されました");
          break;
        }

        const stepDef = getStepByOrder(currentStep);
        if (!stepDef) break;

        const loopIteration = freshProject?.loopCount ?? 0;

        await this.log(projectId, run.id, "info", "executor",
          `ステップ${currentStep}開始: ${stepDef.name}（ループ: ${loopIteration}）`);

        // Update project current step
        await this.prisma.project.update({
          where: { id: projectId },
          data: {
            currentStepKey: stepDef.key,
            progressPercent: calculateProgress(currentStep),
            lastHeartbeatAt: new Date(),
          },
        });

        // Create or reuse step record (upsert handles resume after rejection)
        const step = await this.prisma.workflowStep.upsert({
          where: {
            workflowRunId_stepOrder_loopIteration: {
              workflowRunId: run.id,
              stepOrder: currentStep,
              loopIteration,
            },
          },
          create: {
            workflowRunId: run.id,
            stepOrder: currentStep,
            loopIteration,
            stepKey: stepDef.key,
            stepName: stepDef.name,
            status: "running",
            startedAt: new Date(),
          },
          update: {
            status: "running",
            startedAt: new Date(),
            finishedAt: null,
            errorMessage: null,
          },
        });

        try {
          // Execute step
          await this.executeStep(projectId, run.id, step.id, stepDef.key, loopIteration);

          // Mark step success
          await this.prisma.workflowStep.update({
            where: { id: step.id },
            data: { status: "success", finishedAt: new Date() },
          });

          // Update checkpoint (except Step 18 - checkpoint only updated on approval)
          if (currentStep !== 18) {
            await this.prisma.project.update({
              where: { id: projectId },
              data: {
                checkpointStepOrder: currentStep,
                checkpointLoopIteration: loopIteration,
              },
            });
          }

          // Handle Step 17 (loop evaluation)
          if (currentStep === 17) {
            const loopResult = await this.evaluateLoopCondition(projectId, run.id, runStartTime);

            if (loopResult.shouldContinue) {
              // Loop back to Step 11
              await this.prisma.project.update({
                where: { id: projectId },
                data: { loopCount: { increment: 1 }, loopStatus: "looping" },
              });
              await this.log(projectId, run.id, "info", "loop-controller", "ループ継続 -> ステップ11");
              currentStep = LOOP_START_STEP;
              continue;
            } else {
              // Stop looping
              await this.prisma.project.update({
                where: { id: projectId },
                data: {
                  loopStatus: "stopped",
                  loopStopReason: loopResult.stopReason,
                },
              });
              await this.log(projectId, run.id, "info", "loop-controller",
                `ループ停止: ${loopResult.stopReason}`);

              if (!loopResult.continueToStep18) {
                // Halt - don't proceed to Step 18
                if (loopResult.newProjectStatus) {
                  await this.prisma.project.update({
                    where: { id: projectId },
                    data: { status: loopResult.newProjectStatus, stopReason: loopResult.stopReason },
                  });
                }
                break;
              }
              // Continue to Step 18
            }
          }

          // Handle Step 18 (awaiting_approval)
          if (currentStep === 18) {
            await this.prisma.project.update({
              where: { id: projectId },
              data: { status: "awaiting_approval" },
            });
            await this.log(projectId, run.id, "info", "executor",
              "ステップ18完了。UI画面遷移図のユーザー承認を待機中。");
            // Worker exits; resumes when user approves via API
            return;
          }

          // Handle Step 20 (Devin gate)
          if (currentStep === 20) {
            await this.finalizeWorkflow(projectId, run.id);
            return;
          }

          currentStep++;
        } catch (stepError) {
          const errorMsg = stepError instanceof Error ? stepError.message : String(stepError);
          await this.prisma.workflowStep.update({
            where: { id: step.id },
            data: { status: "failed", finishedAt: new Date(), errorMessage: errorMsg },
          });
          await this.log(projectId, run.id, "error", "executor",
            `ステップ${currentStep}失敗: ${errorMsg}`);

          // Mark project as failed
          await this.prisma.project.update({
            where: { id: projectId },
            data: { status: "failed", stopReason: `step_${currentStep}_failed` },
          });
          await this.prisma.workflowRun.update({
            where: { id: run.id },
            data: { status: "failed", endedAt: new Date() },
          });
          return;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Executor] 致命的エラー (案件 ${projectId}):`, errorMsg);
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: "failed", stopReason: "executor_error" },
      });
      await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "failed", endedAt: new Date() },
      });
    }
  }

  private async executeStep(
    projectId: string,
    runId: string,
    stepId: string,
    stepKey: string,
    loopIteration: number,
  ): Promise<void> {
    switch (stepKey) {
      case "intake":
        await this.handlers.intake(projectId, runId, stepId);
        break;
      case "common_features_apply":
        await this.handlers.commonFeaturesApply(projectId, runId, stepId);
        break;
      case "requirements_generate":
        await this.handlers.requirementsGenerate(projectId, runId, stepId);
        break;
      case "requirements_polish_1":
      case "requirements_polish_2":
        await this.handlers.requirementsPolish(projectId, runId, stepId, stepKey);
        break;
      case "requirements_audit_1":
      case "requirements_audit_2":
        await this.handlers.requirementsAudit(projectId, runId, stepId, stepKey);
        break;
      case "specification_generate":
        await this.handlers.specificationGenerate(projectId, runId, stepId);
        break;
      case "specification_polish_1":
      case "specification_polish_2":
        await this.handlers.specificationPolish(projectId, runId, stepId, stepKey);
        break;
      case "specification_audit_1":
      case "specification_audit_2":
        await this.handlers.specificationAudit(projectId, runId, stepId, stepKey);
        break;
      case "specification_id_assign":
        await this.handlers.specificationIdAssign(projectId, runId, stepId, loopIteration);
        break;
      case "conflict_check":
        await this.handlers.conflictCheck(projectId, runId, stepId, loopIteration);
        break;
      case "spec_score":
        await this.handlers.specScore(projectId, runId, stepId, loopIteration);
        break;
      case "spec_test":
        await this.handlers.specTest(projectId, runId, stepId, loopIteration);
        break;
      case "spec_feedback":
        await this.handlers.specFeedback(projectId, runId, stepId, loopIteration);
        break;
      case "ui_navigation_diagram":
        await this.handlers.uiNavigationDiagram(projectId, runId, stepId);
        break;
      case "export_spec":
        await this.handlers.exportSpec(projectId, runId, stepId);
        break;
      case "devin_gate":
        await this.handlers.devinGate(projectId, runId, stepId);
        break;
      default:
        throw new Error(`不明なステップ: ${stepKey}`);
    }
  }

  private async evaluateLoopCondition(
    projectId: string,
    runId: string,
    runStartTime: number,
  ) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Get previous loop conflict count
    const prevConflicts = await this.prisma.specificationConflict.count({
      where: {
        projectId,
        workflowRunId: runId,
        severity: "critical",
        loopIteration: Math.max(0, project.loopCount - 1),
      },
    });

    const currentConflicts = await this.prisma.specificationConflict.count({
      where: {
        projectId,
        workflowRunId: runId,
        severity: "critical",
        loopIteration: project.loopCount,
      },
    });

    // Check all category scores
    const scoreArtifact = await this.prisma.artifact.findFirst({
      where: { projectId, artifactType: "spec_score_report" },
      orderBy: { versionNo: "desc" },
    });

    let allAboveMinimum = false;
    if (scoreArtifact?.content) {
      try {
        const parsed = JSON.parse(scoreArtifact.content);
        const categories = parsed.categories as ScoreCategoryMap;
        allAboveMinimum = Object.values(categories).every((v) => v >= 80);
      } catch {
        // parse error
      }
    }

    const runtimeSec = Math.round((Date.now() - runStartTime) / 1000);

    return evaluateLoop({
      manualStopRequested: project.manualStopRequested,
      loopCount: project.loopCount,
      currentScore: project.currentScore ?? 0,
      lastScore: project.lastScore,
      currentCriticalConflictCount: currentConflicts,
      previousCriticalConflictCount: prevConflicts,
      allCategoryScoresAboveMinimum: allAboveMinimum,
      workflowRuntimeSec: runtimeSec,
    });
  }

  private async finalizeWorkflow(projectId: string, runId: string): Promise<void> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Evaluate Devin gate
    const scoreArtifact = await this.prisma.artifact.findFirst({
      where: { projectId, artifactType: "spec_score_report" },
      orderBy: { versionNo: "desc" },
    });

    let readyForDevin = false;
    if (scoreArtifact?.content) {
      try {
        const parsed = JSON.parse(scoreArtifact.content);
        const scoreResult = calculateScore(parsed.categories as ScoreCategoryMap);
        const criticalCount = await this.prisma.specificationConflict.count({
          where: { projectId, severity: "critical" },
        });
        const specContent = await this.getLatestArtifactContent(projectId, "specification_final");
        const hasAcceptance = specContent.includes("Acceptance Criteria") || specContent.includes("受入条件");

        readyForDevin = meetsGatingRequirements(scoreResult, criticalCount, hasAcceptance);
      } catch {
        // gate evaluation error - not ready
      }
    }

    const finalStatus = readyForDevin ? "ready_for_devin" : "completed";

    // Update project output
    await this.prisma.projectOutput.upsert({
      where: { projectId },
      create: {
        projectId,
        readyForDevin,
        specScore: project.currentScore,
      },
      update: {
        readyForDevin,
        specScore: project.currentScore,
      },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: finalStatus,
        progressPercent: 100,
      },
    });

    await this.prisma.workflowRun.update({
      where: { id: runId },
      data: { status: "completed", endedAt: new Date() },
    });

    await this.log(projectId, runId, "info", "executor",
      `ワークフロー完了。readyForDevin: ${readyForDevin}, ステータス: ${finalStatus}`);
  }

  private async getLatestArtifactContent(projectId: string, artifactType: string): Promise<string> {
    const artifact = await this.prisma.artifact.findFirst({
      where: { projectId, artifactType },
      orderBy: { versionNo: "desc" },
    });
    return artifact?.content ?? "";
  }

  private async log(
    projectId: string,
    workflowRunId: string,
    logLevel: string,
    source: string,
    message: string,
  ): Promise<void> {
    await this.prisma.workflowLog.create({
      data: { projectId, workflowRunId, logLevel, source, message },
    });
    console.log(`[${source}] [${logLevel}] ${message}`);
  }
}
