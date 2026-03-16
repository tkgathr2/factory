import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed common features
  const features = [
    { featureKey: "audit_log", name: "Audit Log", description: "Audit log tracking for all operations", defaultEnabled: true, priority: 1 },
    { featureKey: "error_handling", name: "Error Handling", description: "Standardized error handling and reporting", defaultEnabled: true, priority: 2 },
    { featureKey: "spec_score", name: "Spec Score", description: "Specification quality scoring", defaultEnabled: true, priority: 3 },
  ];

  for (const feature of features) {
    await prisma.commonFeature.upsert({
      where: { featureKey: feature.featureKey },
      update: {},
      create: feature,
    });
  }

  console.log("Seed completed: 3 common features created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
