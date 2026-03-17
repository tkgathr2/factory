import { PrismaClient } from "@prisma/client";
import { WorkflowExecutor } from "./executor";

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 1000;

async function pollForWork(): Promise<void> {
  // Find queued projects
  const project = await prisma.project.findFirst({
    where: { status: "queued" },
    orderBy: { updatedAt: "asc" },
  });

  if (!project) return;

  console.log(`[Worker] 案件を取得: ${project.projectCode} (${project.id})`);

  const executor = new WorkflowExecutor(prisma);
  await executor.execute(project.id);
}

async function main(): Promise<void> {
  console.log("[Worker] 工場長 ワーカー開始");
  console.log(`[Worker] AIモード=${process.env.AI_MODE || "mock"}`);
  console.log(`[Worker] ポーリング間隔: ${POLL_INTERVAL_MS}ms`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pollForWork();
    } catch (error) {
      console.error("[Worker] ポーリングエラー:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((error) => {
  console.error("[Worker] 致命的エラー:", error);
  process.exit(1);
});
