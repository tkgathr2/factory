import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ChatRequestBody {
  message: string;
}

interface ChatMessageItem {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const SYSTEM_PROMPT = `あなたは「工場長」という要件定義・仕様書生成システムのAIアシスタントです。
ユーザーが入力したラフな要件を基に、質問を通じて要件を深掘り・明確化する役割です。

以下のポイントについて、自然な会話形式で確認してください：
- システムの目的・ゴール
- ターゲットユーザー
- 必要な主要機能
- 画面構成・UI要件
- データの流れ
- 外部連携（API等）
- 非機能要件（パフォーマンス、セキュリティ等）

1回のメッセージで質問は2〜3個までにしてください。
ユーザーの回答を踏まえて次の質問を考えてください。
要件が十分に固まったと判断したら、「要件が整理できました。仕様書の生成を開始しましょう！」と提案してください。
すべて日本語で応答してください。`;

function generateAiResponse(messages: ChatMessageItem[], rawRequirements: string): string {
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  if (userMessageCount === 0) {
    return `ラフ要件を確認しました。いくつか質問させてください。

**確認したい点：**

1. **ターゲットユーザー**: このシステムを使うのは主にどのような方ですか？（例：社内スタッフ、一般消費者、企業の管理者など）

2. **最も重要な機能**: この中で最優先で実現したい機能はどれですか？

3. **既存システムとの連携**: 現在使っているシステムやサービスとの連携は必要ですか？`;
  }

  if (userMessageCount === 1) {
    return `ありがとうございます。もう少し詳しく教えてください。

**追加の確認事項：**

1. **画面構成**: どのような画面が必要だと考えていますか？（例：ログイン画面、ダッシュボード、設定画面など）

2. **データ管理**: どのようなデータを扱いますか？個人情報は含まれますか？

3. **デバイス対応**: PC・スマートフォン両方で使えるようにしますか？`;
  }

  if (userMessageCount === 2) {
    return `だいぶ具体的になってきました。最後にいくつか確認させてください。

**最終確認：**

1. **パフォーマンス要件**: 同時にどのくらいのユーザーが利用する想定ですか？

2. **セキュリティ**: 認証方式は何を想定していますか？（メール/パスワード、OAuth、SSO等）

3. **納期・優先度**: MVP（最小限の実装）で先に出したい機能はありますか？`;
  }

  if (userMessageCount >= 3) {
    return `要件が整理できました！以下の内容で仕様書の生成を開始できます。

**整理された要件のまとめ：**
- ラフ要件の内容を基にした詳細仕様
- ヒアリングで確認した追加要件の反映
- UI画面遷移図の生成
- テストケースの作成

下の「仕様書生成を開始」ボタンを押すと、20ステップのワークフローで検証済み仕様書を自動生成します。`;
  }

  return "ご入力ありがとうございます。内容を確認しています。";
}

/** GET /api/projects/[id]/chat — チャット履歴取得 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/chat エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}

/** POST /api/projects/[id]/chat — メッセージ送信 + AI応答 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = (await request.json()) as ChatRequestBody;

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "validation_error", detail: "メッセージを入力してください" },
        { status: 422 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { inputs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!project) {
      return NextResponse.json(
        { error: "not_found", detail: "案件が見つかりません" },
        { status: 404 },
      );
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { projectId, role: "user", content: body.message.trim() },
    });

    // Get all messages for context
    const allMessages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    const formattedMessages: ChatMessageItem[] = allMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    // Generate AI response (mock for now, will be replaced with real AI)
    const rawRequirements = project.inputs[0]?.rawPrompt ?? "";
    const aiContent = generateAiResponse(formattedMessages, rawRequirements);

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: { projectId, role: "assistant", content: aiContent },
    });

    // Return updated messages
    const updatedMessages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      messages: updatedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      latestAssistant: {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/chat エラー:", error);
    return NextResponse.json(
      { error: "internal_error", detail: String(error) },
      { status: 500 },
    );
  }
}
