# Module: prDescription

## Purpose
Generate a structured PR description from the diff between the current
branch and the default branch. Output follows the template defined in 
the project's CLAUDE.md.

## Dependencies
- core/ai          — AI provider for generating the description
- core/git         — read diff against default branch
- core/confirmation — interactive y/n/edit/regenerate prompt

## Public API
```ts
export interface PrDescriptionInput {
  ai: AIProvider
  git: GitClient
  confirmation: Confirmation
  mode: ConfirmMode
  template?: string   // optional override for the default template
}

export interface PrDescriptionResult {
  status: 'generated' | 'cancelled' | 'dryrun'
  title?: string
  body?: string
}

export function createPrDescription(
  input: PrDescriptionInput
): {
  run(): Promise<PrDescriptionResult>
}
```

## Flow
1. Get current branch and default branch from git client
2. If current branch equals default branch, throw PrDescriptionError
   "Cannot generate PR description from default branch."
3. Get diff between default branch and current branch
4. Get list of changed files
5. Get last 3 commit messages on the current branch for context
6. Build prompt for AI with diff, files, and commit messages
7. Get title and body from AI provider as JSON
8. Validate output structure
9. Show preview via confirmation module
10. Handle user response:
    - yes        → return generated with title and body
    - edit       → use edited text, parse title from first line
    - regenerate → loop back to step 6
    - no         → return cancelled

## Default PR template