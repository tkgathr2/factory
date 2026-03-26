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
    subgraph auth["認証フロー"]
        UI001["UI-001\nログイン画面"]
        UI001_REG["UI-001a\n新規登録フォーム"]
        UI001_ERR["エラー表示\n認証失敗"]
        UI001_RESET["UI-001b\nパスワードリセット"]
    end

    subgraph main["メイン機能"]
        UI002["UI-002\nダッシュボード"]
        UI003["UI-003\nユーザー設定"]
        UI004["UI-004\nプロフィール編集"]
    end

    subgraph data["データ管理"]
        UI005["UI-005\nデータ一覧"]
        UI006["UI-006\nデータ詳細"]
        UI007["UI-007\n新規作成フォーム"]
        UI008["UI-008\n編集フォーム"]
        UI009["UI-009\n削除確認ダイアログ"]
    end

    subgraph report["レポート"]
        UI010["UI-010\nレポート一覧"]
        UI011["UI-011\nレポート詳細\nグラフ表示"]
        UI012["UI-012\nCSVエクスポート"]
    end

    %% 認証フロー
    UI001 -->|"ログイン成功"| UI002
    UI001 -->|"認証失敗"| UI001_ERR
    UI001_ERR -->|"再試行"| UI001
    UI001 -->|"新規登録"| UI001_REG
    UI001_REG -->|"登録完了"| UI002
    UI001_REG -->|"戻る"| UI001
    UI001 -->|"パスワード忘れ"| UI001_RESET
    UI001_RESET -->|"リセット完了"| UI001

    %% メイン画面間の遷移
    UI002 -->|"設定"| UI003
    UI002 -->|"プロフィール"| UI004
    UI003 -->|"戻る"| UI002
    UI004 -->|"保存/戻る"| UI002

    %% データ管理フロー
    UI002 -->|"データ管理"| UI005
    UI005 -->|"詳細表示"| UI006
    UI005 -->|"新規作成"| UI007
    UI006 -->|"編集"| UI008
    UI006 -->|"削除"| UI009
    UI007 -->|"保存完了"| UI005
    UI008 -->|"更新完了"| UI006
    UI009 -->|"確定"| UI005
    UI009 -->|"キャンセル"| UI006
    UI005 -->|"戻る"| UI002
    UI006 -->|"一覧に戻る"| UI005

    %% レポートフロー
    UI002 -->|"レポート"| UI010
    UI010 -->|"詳細"| UI011
    UI011 -->|"エクスポート"| UI012
    UI010 -->|"戻る"| UI002
    UI011 -->|"一覧に戻る"| UI010

    %% ログアウト
    UI002 -->|"ログアウト"| UI001
    UI003 -->|"ログアウト"| UI001

    %% スタイリング
    style auth fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style main fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style data fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style report fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style UI001 fill:#fff9c4,stroke:#f9a825
    style UI002 fill:#bbdefb,stroke:#1976d2
    style UI001_ERR fill:#ffcdd2,stroke:#e53935
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
