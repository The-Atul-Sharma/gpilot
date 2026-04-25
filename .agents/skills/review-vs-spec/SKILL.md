
---
name: review-vs-spec
description: Verify implementation matches the spec, list any gaps
---

Read .spec.md and index.ts in the current directory.
Check if the implementation matches the spec exactly.

Output format — produce a checklist:

## Spec compliance check

### Public API
- [✓] or [✗] each function/type from the spec's Public API section

### Rules
- [✓] or [✗] each rule from the spec's Rules section

### Error cases
- [✓] or [✗] each error case from the spec's Error cases section

### Test coverage
- [✓] or [✗] each test from the spec's Tests required section

### Issues found
List each spec violation with:
- File and line number
- What the spec says
- What the code does
- Suggested fix

Do NOT modify any files in this step. Only report findings.
