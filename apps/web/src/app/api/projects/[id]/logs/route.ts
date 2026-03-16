import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GetLogsResponse } from "@spec-engine/shared";

/** GET /api/projects/{id}/logs */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "not_found", detail: "Project not found" },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const cursor = url.searchParams.get("cursor") || undefined;

    const where: Record<string, unknown> = { projectId: project.id };
    if (cursor) {
      where.id = { lt: cursor };
    }

    const logs = await prisma.workflowLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;

    const response: GetLogsResponse = {
      logs: items.map((l) => ({
        message: l.message,
        source: l.source,
        logLevel: l.logLevel,
        createdAt: l.createdAt.toISOString(),
      })),
      total: items.length,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/projects/[id]/logs error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
