import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed common features
  const features = [
    { featureKey: "audit_log", name: "監査ログ", description: "全操作の監査ログ追跡", defaultEnabled: true, priority: 1 },
    { featureKey: "error_handling", name: "エラーハンドリング", description: "標準化されたエラー処理と報告", defaultEnabled: true, priority: 2 },
    { featureKey: "spec_score", name: "仕様スコア", description: "仕様書の品質スコアリング", defaultEnabled: true, priority: 3 },
  ];

  for (const feature of features) {
    await prisma.commonFeature.upsert({
      where: { featureKey: feature.featureKey },
      update: {},
      create: feature,
    });
  }

  console.log("シード完了: 共通機能3件を作成しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
