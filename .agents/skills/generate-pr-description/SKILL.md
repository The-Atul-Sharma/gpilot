---
name: generate-pr-description
description: Generate Azure DevOps or GitHub PR description from current branch diff
---

Read the git diff between the current branch and main:
  git diff main...HEAD

Read the project's CLAUDE.md for the PR description template.

Output a markdown PR description with these sections:

### What changed
2-3 sentences summarizing the change. Mention which spec was implemented.

### Why
The motivation. What problem does this solve?

### How to test
Numbered steps a reviewer can follow to verify the change works.
Include the npm test command for the affected modules.

### Breaking changes
List any. If none, write "None".

### Related spec files
List the .spec.md files this PR implements or modifies.

Constraints:
- Never include file names in the "What changed" section
- Use sentence case for headings
- Keep total length under 300 words
EOF