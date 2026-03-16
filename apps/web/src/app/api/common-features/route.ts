import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CommonFeatureListResponse, CreateCommonFeatureRequest, CommonFeatureResponse } from "@spec-engine/shared";

/** GET /api/common-features */
export async function GET() {
  try {
    const features = await prisma.commonFeature.findMany({
      orderBy: { priority: "asc" },
    });

    const response: CommonFeatureListResponse = {
      commonFeatures: features.map((f) => ({
        id: f.id,
        featureKey: f.featureKey,
        name: f.name,
        description: f.description,
        defaultEnabled: f.defaultEnabled,
        priority: f.priority,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/common-features error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}

/** POST /api/common-features */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCommonFeatureRequest;

    if (!body.featureKey || !body.name) {
      return NextResponse.json(
        { error: "validation_error", detail: "featureKey and name are required" },
        { status: 422 },
      );
    }

    // Check uniqueness
    const existing = await prisma.commonFeature.findUnique({
      where: { featureKey: body.featureKey },
    });

    if (existing) {
      return NextResponse.json(
        { error: "conflict", detail: `featureKey '${body.featureKey}' already exists` },
        { status: 409 },
      );
    }

    const feature = await prisma.commonFeature.create({
      data: {
        featureKey: body.featureKey,
        name: body.name,
        description: body.description ?? "",
        defaultEnabled: body.defaultEnabled ?? true,
        priority: body.priority ?? 100,
      },
    });

    const response: CommonFeatureResponse = {
      id: feature.id,
      featureKey: feature.featureKey,
      name: feature.name,
      description: feature.description,
      defaultEnabled: feature.defaultEnabled,
      priority: feature.priority,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("POST /api/common-features error:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
