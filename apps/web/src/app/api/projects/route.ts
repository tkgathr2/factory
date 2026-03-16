import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProjectCode } from "@spec-engine/engine";
import type { CreateProjectRequest, CreateProjectResponse, ListProjectsResponse } from "@spec-engine/shared";

/** POST /api/projects — Create project */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProjectRequest;

    if (!body.title || !body.rawRequirements) {
      return NextResponse.json(
        { error: "validation_error", detail: "title and rawRequirements are required" },
        { status: 422 },
      );
    }

    const projectCode = generateProjectCode();

    const project = await prisma.project.create({
      data: {
        projectCode,
        title: body.title,
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
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}

/** GET /api/projects — List projects */
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
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
