
---
name: implement-spec
description: Implement a module from its .spec.md following CLAUDE.md conventions
---

Read the .spec.md file in the current working directory.
Implement the module in index.ts following all rules from
the project root CLAUDE.md and the spec file.

Order of work:

1. Read and understand the .spec.md fully before writing code
2. Read CLAUDE.md from the project root for conventions
3. Generate TypeScript types and interfaces first
4. Implement the public API as specified in the .spec.md
5. Add named exports only (no default exports)
6. Add JSDoc comments on every exported function
7. Throw typed errors as specified in the spec's Error cases section

Constraints:

- Do NOT write tests in this step (use the write-tests skill for that)
- Do NOT modify the .spec.md
- Use ESM imports (import x from 'y'), never require()
- Use async/await, never .then() chains
- Validate inputs at function entry using zod
- Every error message must suggest the fix, not just state the problem
