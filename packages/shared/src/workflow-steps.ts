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
  { order: 1, key: "intake", name: "Intake", aiCall: false, loopable: false },
  { order: 2, key: "common_features_apply", name: "Common Features Apply", aiCall: false, loopable: false },
  { order: 3, key: "requirements_generate", name: "Requirements Generate", aiCall: true, aiPrompt: "ai-prompts/requirements_generate.md", loopable: false },
  { order: 4, key: "requirements_polish_1", name: "Requirements Polish 1", aiCall: true, aiPrompt: "ai-prompts/requirements_polish.md", loopable: false },
  { order: 5, key: "requirements_polish_2", name: "Requirements Polish 2", aiCall: true, aiPrompt: "ai-prompts/requirements_polish.md", loopable: false },
  { order: 6, key: "requirements_audit_1", name: "Requirements Audit 1", aiCall: true, aiPrompt: "ai-prompts/requirements_audit.md", loopable: false },
  { order: 7, key: "requirements_audit_2", name: "Requirements Audit 2", aiCall: true, aiPrompt: "ai-prompts/requirements_audit.md", loopable: false },
  { order: 8, key: "specification_generate", name: "Specification Generate", aiCall: true, aiPrompt: "ai-prompts/specification_generate.md", loopable: false },
  { order: 9, key: "specification_polish_1", name: "Specification Polish 1", aiCall: true, aiPrompt: "ai-prompts/specification_polish.md", loopable: false },
  { order: 10, key: "specification_polish_2", name: "Specification Polish 2", aiCall: true, aiPrompt: "ai-prompts/specification_polish.md", loopable: false },
  { order: 11, key: "specification_audit_1", name: "Specification Audit 1", aiCall: true, aiPrompt: "ai-prompts/specification_audit.md", loopable: true },
  { order: 12, key: "specification_audit_2", name: "Specification Audit 2", aiCall: true, aiPrompt: "ai-prompts/specification_audit.md", loopable: true },
  { order: 13, key: "specification_id_assign", name: "Specification ID Assign", aiCall: false, loopable: true },
  { order: 14, key: "conflict_check", name: "Conflict Check", aiCall: false, loopable: true },
  { order: 15, key: "spec_score", name: "Spec Score", aiCall: false, loopable: true },
  { order: 16, key: "spec_test", name: "Spec Test", aiCall: false, loopable: true },
  { order: 17, key: "spec_feedback", name: "Spec Feedback", aiCall: true, aiPrompt: "ai-prompts/specification_improve.md", loopable: true },
  { order: 18, key: "ui_navigation_diagram", name: "UI Navigation Diagram", aiCall: true, aiPrompt: "ai-prompts/ui_navigation_diagram_generate.md", loopable: false },
  { order: 19, key: "export_spec", name: "Export Spec", aiCall: false, loopable: false },
  { order: 20, key: "devin_gate", name: "Devin Gate", aiCall: false, loopable: false },
];

export const LOOP_START_STEP = 11;
export const LOOP_END_STEP = 17;

export function getStepByOrder(order: number): WorkflowStepDefinition | undefined {
  return WORKFLOW_STEPS.find((s) => s.order === order);
}

export function getStepByKey(key: string): WorkflowStepDefinition | undefined {
  return WORKFLOW_STEPS.find((s) => s.key === key);
}
