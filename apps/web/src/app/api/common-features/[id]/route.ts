import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UpdateCommonFeatureRequest, CommonFeatureResponse } from "@spec-engine/shared";

/** PATCH /api/common-features/{id} */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const feature = await prisma.commonFeature.findUnique({
      where: { id: params.id },
    });

    if (!feature) {
      return NextResponse.json(
        { error: "not_found", detail: "共通機能が見つかりません" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as UpdateCommonFeatureRequest;

    const updated = await prisma.commonFeature.update({
      where: { id: params.id },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.defaultEnabled !== undefined && { defaultEnabled: body.defaultEnabled }),
        ...(body.priority !== undefined && { priority: body.priority }),
      },
    });

    const response: CommonFeatureResponse = {
      id: updated.id,
      featureKey: updated.featureKey,
      name: updated.name,
      description: updated.description,
      defaultEnabled: updated.defaultEnabled,
      priority: updated.priority,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("PATCH /api/common-features/[id] エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
