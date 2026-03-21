import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExportBundle } from "@spec-engine/engine";
import { readFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/** Artifact types to include in the ZIP export bundle */
const EXPORT_ARTIFACT_DEFS = [
  { type: "requirements_final", filename: "requirements_final.md" },
  { type: "specification_final", filename: "specification_final.md" },
  { type: "conflict_report", filename: "conflict_report.json" },
  { type: "spec_score_report", filename: "spec_score_report.json" },
  { type: "spec_test_report", filename: "spec_test_report.json" },
  { type: "ui_navigation_diagram_mermaid", filename: "ui_navigation_diagram.mmd" },
  { type: "ui_navigation_diagram_png", filename: "ui_navigation_diagram.png" },
];

/** GET /api/projects/{id}/export-zip
 *  Generates ZIP on-demand from database artifacts (works across containers)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "not_found", detail: "案件が見つかりません" },
        { status: 404 },
      );
    }

    // Check that export step has been completed (export_bundle artifact exists)
    const exportArtifact = await prisma.artifact.findFirst({
      where: {
        projectId: project.id,
        artifactType: "export_bundle",
      },
      orderBy: { versionNo: "desc" },
    });

    if (!exportArtifact) {
      return NextResponse.json(
        { error: "conflict", detail: "エクスポートバンドルがまだ準備できていません。ステップ19が完了する必要があります。" },
        { status: 409 },
      );
    }

    // Fetch all artifacts from database and generate ZIP on-demand
    const artifacts = await Promise.all(
      EXPORT_ARTIFACT_DEFS.map(async (def) => {
        const artifact = await prisma.artifact.findFirst({
          where: { projectId: project.id, artifactType: def.type },
          orderBy: { versionNo: "desc" },
        });
        return artifact?.content ? { filename: def.filename, content: artifact.content } : null;
      }),
    );

    const validArtifacts = artifacts.filter(
      (a): a is { filename: string; content: string } => a !== null,
    );

    if (validArtifacts.length === 0) {
      return NextResponse.json(
        { error: "not_found", detail: "エクスポート可能な成果物が見つかりません" },
        { status: 404 },
      );
    }

    // Generate ZIP to a temporary file
    const tmpDir = join(tmpdir(), "factory-exports");
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }
    const zipPath = join(tmpDir, `${project.projectCode}_${Date.now()}.zip`);

    await createExportBundle(validArtifacts, zipPath);

    const fileBuffer = readFileSync(zipPath);
    const filename = `${project.projectCode}_spec_bundle.zip`;

    // Clean up temp file
    try { unlinkSync(zipPath); } catch { /* ignore cleanup errors */ }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/export-zip エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
