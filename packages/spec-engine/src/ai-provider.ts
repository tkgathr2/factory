/**
 * AI Provider abstraction.
 * Supports mock mode (AI_MODE=mock) and live mode (Claude/OpenAI).
 */

export interface AiRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export interface AiResponse {
  content: string;
  model: string;
  tokensUsed: number;
}

export interface AiProvider {
  call(request: AiRequest): Promise<AiResponse>;
}

/**
 * Mock AI provider for testing.
 * Returns deterministic mock responses based on prompt content.
 */
export class MockAiProvider implements AiProvider {
  async call(request: AiRequest): Promise<AiResponse> {
    const prompt = request.prompt.toLowerCase();

    // ui_navigation_diagram must be checked BEFORE "要件" since spec content contains "要件"
    if (prompt.includes("ui_navigation_diagram") || prompt.includes("画面遷移")) {
      return {
        content: this.mockMermaidDiagram(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("requirements_generate") || prompt.includes("要件")) {
      return {
        content: this.mockRequirements(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("requirements_polish") || prompt.includes("ポリッシュ")) {
      return {
        content: request.prompt.includes("INPUT:") ? request.prompt.split("INPUT:")[1] : this.mockRequirements(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("requirements_audit") || prompt.includes("監査")) {
      return {
        content: JSON.stringify({ findings: [] }),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("specification_generate") || prompt.includes("仕様書")) {
      return {
        content: this.mockSpecification(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("specification_polish")) {
      return {
        content: request.prompt.includes("INPUT:") ? request.prompt.split("INPUT:")[1] : this.mockSpecification(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("specification_audit")) {
      return {
        content: JSON.stringify({ findings: [] }),
        model: "mock",
        tokensUsed: 0,
      };
    }

    if (prompt.includes("specification_improve") || prompt.includes("改善")) {
      return {
        content: request.prompt.includes("INPUT:") ? request.prompt.split("INPUT:")[1] : this.mockSpecification(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    return {
      content: "モックレスポンス: " + prompt.slice(0, 100),
      model: "mock",
      tokensUsed: 0,
    };
  }

  private mockRequirements(): string {
    return `# 要件

## REQ-001: ユーザー認証
ユーザーは登録とログインができること。

## REQ-002: ダッシュボード
ログイン後にダッシュボードが表示されること。

## 受入条件
- メールアドレスで登録できる
- 認証情報でログインできる
- ダッシュボードに主要指標が表示される
`;
  }

  private mockSpecification(): string {
    return `# 仕様書

## 1. 概要
ユーザー認証とダッシュボードを提供するシステム。

## 2. 機能要件
### REQ-001: ユーザー認証
メール/パスワードによる登録とログイン。

### REQ-002: ダッシュボード
主要指標を表示するメインダッシュボード。

## 3. UI画面
### UI-001: ログイン画面
メールとパスワードの入力フォームと送信ボタン。

### UI-002: ダッシュボード画面
指標とナビゲーションメニューを表示。

## 4. APIエンドポイント
### API-001: POST /auth/register
新規ユーザーアカウントの作成。

### API-002: POST /auth/login
ユーザー認証とトークン発行。

## 5. データベーススキーマ
### DB-001: ユーザーテーブル
id, email, password_hash, created_at

## 6. テストケース
### TEST-001: 登録フロー - REQ-001
有効なメールアドレスでユーザー登録できることを検証。

### TEST-002: ログインフロー - REQ-001
正しい認証情報でログインできることを検証。

### TEST-003: ダッシュボード読込 - REQ-002
認証後にダッシュボードが読み込まれることを検証。

## 7. UI遷移
### UI-001 → UI-002: ログイン成功後

## 受入条件
- 登録が正常に完了する
- ログインで有効なトークンが返される
- ダッシュボードが2秒以内に描画される
`;
  }

  private mockMermaidDiagram(): string {
    return `flowchart TD
    UI001[ログイン画面] --> UI002[ダッシュボード]
    UI001 --> UI001_ERR[ログインエラー]
    UI001_ERR --> UI001
`;
  }
}

/**
 * Create AI provider based on AI_MODE environment variable.
 */
export function createAiProvider(): AiProvider {
  const mode = process.env.AI_MODE || "mock";
  if (mode === "mock") {
    return new MockAiProvider();
  }
  // Live providers would be implemented here
  throw new Error(`未対応のAI_MODE: ${mode}。テスト用には 'mock' を使用してください。`);
}
