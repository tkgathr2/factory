import { PrismaClient } from "@prisma/client";
import { WorkflowExecutor } from "./executor";

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 3000;

async function pollForWork(): Promise<void> {
  // Find queued projects
  const project = await prisma.project.findFirst({
    where: { status: "queued" },
    orderBy: { updatedAt: "asc" },
  });

  if (!project) return;

  console.log(`[Worker] Picked up project ${project.projectCode} (${project.id})`);

  const executor = new WorkflowExecutor(prisma);
  await executor.execute(project.id);
}

async function main(): Promise<void> {
  console.log("[Worker] Specification Engine Worker started");
  console.log(`[Worker] AI_MODE=${process.env.AI_MODE || "mock"}`);
  console.log(`[Worker] Poll interval: ${POLL_INTERVAL_MS}ms`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pollForWork();
    } catch (error) {
      console.error("[Worker] Poll error:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((error) => {
  console.error("[Worker] Fatal error:", error);
  process.exit(1);
});
