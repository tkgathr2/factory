import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

/**
 * Load AI prompt template from ai-prompts/ directory.
 * Source of Truth: workflow-spec/prompt_input_mapping.md
 */
export function loadPromptTemplate(promptPath: string, basePath?: string): string {
  const base = basePath || process.cwd();
  const fullPath = resolve(base, promptPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Prompt template not found: ${fullPath}`);
  }

  return readFileSync(fullPath, "utf-8");
}

/**
 * Render prompt by replacing placeholders with input values.
 */
export function renderPrompt(
  template: string,
  inputs: Record<string, string>,
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(inputs)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return rendered;
}
