# Grilling

Use this support skill to resolve blocking ambiguity inside an active workflow.

`grilling` is a shared clarification discipline, not a standalone user workflow. The calling
workflow keeps ownership of role routing, context gates, output formats, approvals, stop
conditions, memory updates, and next-step routing.

## Evidence First

Before asking a question, inspect the available evidence relevant to the uncertainty:

```txt
project memory
docs and plans
code and configuration
package files
tests
provided context
```

Do not ask the user for an answer that this evidence can provide. If uncertainty depends on
external technical facts, route through the active workflow's docs-first boundary before asking.

## Relentless on Blockers

Interview relentlessly until blocking ambiguity is resolved, but do not expand into non-blocking
discovery or an unbounded questionnaire.

Walk the decision tree one dependency-ordered branch at a time. Ask one question at a time unless
a tight group belongs to the same decision and answering it together materially reduces friction.

With each question:

- provide a recommended answer or direction;
- explain why the decision blocks progress;
- state the impact of the choice;
- wait for the answer before opening a dependent branch.

Do not ask a lower-level question when a higher-level answer would make it irrelevant.

## Stop and Return

Return control to the calling workflow when:

- it can continue safely;
- the blocking ambiguity is resolved;
- further questions are no longer high-leverage; or
- progress is blocked on user input.

Do not plan, implement, review, research, publish, update project memory, or change workflow scope
from this support skill. Report unresolved blocking ambiguity through the calling workflow's
existing output and approval contract.
