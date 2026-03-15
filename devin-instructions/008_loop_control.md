# Phase 8 Loop Control

## Goal
T-070: Improvement loop controller executes safely.

## Target files
- loop-control/loop_policy.yml
- workflow-spec/workflow_steps_detailed.md
- prisma/schema.prisma

## Completion
- loopCount increments per loop iteration
- Steps 11→17 re-created with loopIteration = loopCount
- All stop conditions in loop_policy.yml are enforced
- manual emergency stop sets project.status = blocked
- soft_limit warning appears in monitor at loopCount = softLimit
