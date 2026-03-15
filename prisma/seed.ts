import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const features = [
    {
      featureKey: "audit-log",
      name: "Audit Log",
      description: "Track workflow execution and validation events",
      defaultEnabled: true,
      priority: 100,
    },
    {
      featureKey: "error-handling",
      name: "Error Handling",
      description: "Standard error structure and retry handling",
      defaultEnabled: true,
      priority: 100,
    },
    {
      featureKey: "spec-score",
      name: "Spec Score",
      description: "10 category scoring and readiness evaluation",
      defaultEnabled: true,
      priority: 100,
    },
  ];

  for (const feature of features) {
    await prisma.commonFeature.upsert({
      where: { featureKey: feature.featureKey },
      update: feature,
      create: feature,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
