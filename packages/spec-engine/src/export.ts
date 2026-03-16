import { createWriteStream, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import archiver from "archiver";

export interface ExportArtifact {
  filename: string;
  content: string | Buffer;
}

/**
 * Create a ZIP bundle containing all export artifacts.
 * Source of Truth: validation/required_artifacts.yml required_before_export
 */
export async function createExportBundle(
  artifacts: ExportArtifact[],
  outputPath: string,
): Promise<string> {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      resolve(outputPath);
    });

    archive.on("error", (err: Error) => {
      reject(err);
    });

    archive.pipe(output);

    for (const artifact of artifacts) {
      if (Buffer.isBuffer(artifact.content)) {
        archive.append(artifact.content, { name: artifact.filename });
      } else {
        archive.append(artifact.content, { name: artifact.filename });
      }
    }

    archive.finalize();
  });
}
