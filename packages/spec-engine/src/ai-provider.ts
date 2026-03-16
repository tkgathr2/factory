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

    if (prompt.includes("ui_navigation_diagram") || prompt.includes("画面遷移")) {
      return {
        content: this.mockMermaidDiagram(),
        model: "mock",
        tokensUsed: 0,
      };
    }

    return {
      content: "Mock response for: " + prompt.slice(0, 100),
      model: "mock",
      tokensUsed: 0,
    };
  }

  private mockRequirements(): string {
    return `# Requirements

## REQ-001: User Authentication
Users must be able to register and login.

## REQ-002: Dashboard
Users must see a dashboard after login.

## Acceptance Criteria
- Users can register with email
- Users can login with credentials
- Dashboard displays key metrics
`;
  }

  private mockSpecification(): string {
    return `# Specification

## 1. Overview
System provides user authentication and dashboard.

## 2. Functional Requirements
### REQ-001: User Authentication
Users register and login via email/password.

### REQ-002: Dashboard
Main dashboard showing key metrics.

## 3. UI Screens
### UI-001: Login Screen
Email and password input with submit button.

### UI-002: Dashboard Screen
Displays metrics and navigation menu.

## 4. API Endpoints
### API-001: POST /auth/register
Create new user account.

### API-002: POST /auth/login
Authenticate user and return token.

## 5. Database Schema
### DB-001: Users Table
id, email, password_hash, created_at

## 6. Test Cases
### TEST-001: Registration Flow - REQ-001
Verify user can register with valid email.

### TEST-002: Login Flow - REQ-001
Verify user can login with correct credentials.

### TEST-003: Dashboard Load - REQ-002
Verify dashboard loads after authentication.

## 7. UI Navigation
### UI-001 → UI-002: After successful login

## Acceptance Criteria
- Registration completes successfully
- Login returns valid token
- Dashboard renders within 2 seconds
`;
  }

  private mockMermaidDiagram(): string {
    return `flowchart TD
    UI001[Login Screen] --> UI002[Dashboard]
    UI001 --> UI001_ERR[Login Error]
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
  throw new Error(`Unsupported AI_MODE: ${mode}. Use 'mock' for testing.`);
}
