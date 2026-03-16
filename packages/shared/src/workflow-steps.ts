/** Source of Truth: workflow-spec/workflow_steps_detailed.md */

export interface WorkflowStepDefinition {
  order: number;
  key: string;
  name: string;
  aiCall: boolean;
  aiPrompt?: string;
  loopable: boolean;
}

export const WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  { order: 1, key: "intake", name: "要件取込", aiCall: false, loopable: false },
  { order: 2, key: "common_features_apply", name: "共通機能適用", aiCall: false, loopable: false },
  { order: 3, key: "requirements_generate", name: "要件生成", aiCall: true, aiPrompt: "ai-prompts/requirements_generate.md", loopable: false },
  { order: 4, key: "requirements_polish_1", name: "要件磨き上げ1", aiCall: true, aiPrompt: "ai-prompts/requirements_polish.md", loopable: false },
  { order: 5, key: "requirements_polish_2", name: "要件磨き上げ2", aiCall: true, aiPrompt: "ai-prompts/requirements_polish.md", loopable: false },
  { order: 6, key: "requirements_audit_1", name: "要件監査1", aiCall: true, aiPrompt: "ai-prompts/requirements_audit.md", loopable: false },
  { order: 7, key: "requirements_audit_2", name: "要件監査2", aiCall: true, aiPrompt: "ai-prompts/requirements_audit.md", loopable: false },
  { order: 8, key: "specification_generate", name: "仕様書生成", aiCall: true, aiPrompt: "ai-prompts/specification_generate.md", loopable: false },
  { order: 9, key: "specification_polish_1", name: "仕様書磨き上げ1", aiCall: true, aiPrompt: "ai-prompts/specification_polish.md", loopable: false },
  { order: 10, key: "specification_polish_2", name: "仕様書磨き上げ2", aiCall: true, aiPrompt: "ai-prompts/specification_polish.md", loopable: false },
  { order: 11, key: "specification_audit_1", name: "仕様書監査1", aiCall: true, aiPrompt: "ai-prompts/specification_audit.md", loopable: true },
  { order: 12, key: "specification_audit_2", name: "仕様書監査2", aiCall: true, aiPrompt: "ai-prompts/specification_audit.md", loopable: true },
  { order: 13, key: "specification_id_assign", name: "仕様書ID付与", aiCall: false, loopable: true },
  { order: 14, key: "conflict_check", name: "矛盾検出", aiCall: false, loopable: true },
  { order: 15, key: "spec_score", name: "仕様スコア", aiCall: false, loopable: true },
  { order: 16, key: "spec_test", name: "仕様テスト", aiCall: false, loopable: true },
  { order: 17, key: "spec_feedback", name: "仕様フィードバック", aiCall: true, aiPrompt: "ai-prompts/specification_improve.md", loopable: true },
  { order: 18, key: "ui_navigation_diagram", name: "UI画面遷移図", aiCall: true, aiPrompt: "ai-prompts/ui_navigation_diagram_generate.md", loopable: false },
  { order: 19, key: "export_spec", name: "仕様書エクスポート", aiCall: false, loopable: false },
  { order: 20, key: "devin_gate", name: "Devinゲート", aiCall: false, loopable: false },
];

export const LOOP_START_STEP = 11;
export const LOOP_END_STEP = 17;

export function getStepByOrder(order: number): WorkflowStepDefinition | undefined {
  return WORKFLOW_STEPS.find((s) => s.order === order);
}

export function getStepByKey(key: string): WorkflowStepDefinition | undefined {
  return WORKFLOW_STEPS.find((s) => s.key === key);
}
