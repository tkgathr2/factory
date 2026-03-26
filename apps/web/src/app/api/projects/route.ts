import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProjectCode } from "@spec-engine/engine";
import type { CreateProjectRequest, CreateProjectResponse, ListProjectsResponse } from "@spec-engine/shared";

/** rawRequirementsからタイトルを自動生成 */
function generateTitle(rawRequirements: string): string {
  const text = rawRequirements.trim();
  if (!text) return "無題の案件";

  // Take first line or first sentence
  const firstLine = text.split(/[\n。！？!?]/)[0].trim();
  if (!firstLine) return "無題の案件";

  // Truncate to reasonable length
  if (firstLine.length <= 30) return firstLine;
  return firstLine.slice(0, 30) + "...";
}

/** POST /api/projects — Create project */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProjectRequest;

    if (!body.rawRequirements) {
      return NextResponse.json(
        { error: "validation_error", detail: "ラフ要件は必須です" },
        { status: 422 },
      );
    }

    const projectCode = generateProjectCode();

    // Auto-generate title from rawRequirements if not provided
    const autoTitle = body.title?.trim()
      ? body.title.trim()
      : generateTitle(body.rawRequirements);

    const project = await prisma.project.create({
      data: {
        projectCode,
        title: autoTitle,
        status: "draft",
        inputs: {
          create: {
            rawPrompt: body.rawRequirements,
            goal: body.goal ?? "",
            problem: body.problem ?? "",
            targetUsers: body.targetUsers ?? "",
            requiredFeatures: body.requiredFeatures ?? [],
            optionalFeatures: body.optionalFeatures ?? [],
          },
        },
      },
    });

    // Link common features if provided
    if (body.commonFeatureIds && body.commonFeatureIds.length > 0) {
      await prisma.projectCommonFeature.createMany({
        data: body.commonFeatureIds.map((cfId) => ({
          projectId: project.id,
          commonFeatureId: cfId,
        })),
      });
    }

    const response: CreateProjectResponse = {
      id: project.id,
      projectCode: project.projectCode,
      status: "draft",
      createdAt: project.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}

/** GET /api/projects — 案件一覧取得 */
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
    });

    const response: ListProjectsResponse = {
      projects: projects.map((p) => ({
        id: p.id,
        projectCode: p.projectCode,
        title: p.title,
        status: p.status,
        progressPercent: p.progressPercent,
        loopCount: p.loopCount,
        lastHeartbeatAt: p.lastHeartbeatAt?.toISOString() ?? null,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/projects エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
