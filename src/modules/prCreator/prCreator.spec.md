# Module: prCreator

## Purpose
Open a pull request on the configured platform (GitHub or Azure DevOps)
using a generated description. Push the current branch first if needed.

## Dependencies
- core/git           — branch info, push, remote URL
- core/confirmation  — y/n/edit prompt before opening PR
- modules/prDescription — generates title and body
- platforms (interface) — actual PR creation on GitHub or Azure DevOps

## Public API
```ts
export interface GitPlatform {
  createPR(input: CreatePRInput): Promise<CreatedPR>
}

export interface CreatePRInput {
  title: string
  body: string
  sourceBranch: string
  targetBranch: string
}

export interface CreatedPR {
  id: string
  url: string
  number: number
}

export interface PrCreatorInput {
  platform: GitPlatform
  prDescription: ReturnType<typeof createPrDescription>
  git: GitClient
  confirmation: Confirmation
  mode: ConfirmMode
}

export interface PrCreatorResult {
  status: 'created' | 'cancelled' | 'dryrun'
  pr?: CreatedPR
}

export function createPrCreator(
  input: PrCreatorInput
): {
  run(): Promise<PrCreatorResult>
}
```

## Flow
1. Get current branch and default branch from git client
2. If current branch equals default branch, throw PrCreatorError
   "Cannot create PR from default branch."
3. Push current branch if not already on remote (use git client)
4. Run prDescription.run() to get title and body
5. If user cancelled description generation, return cancelled
6. Show final preview via confirmation:
   "About to open PR: <title>"
7. Handle confirmation:
   - yes     → call platform.createPR, return created with pr details
   - no      → return cancelled
   - dryrun  → print what would be created, return dryrun

## Rules
- Always target the default branch (main or master) by default
- Source branch is whatever the current branch is
- Push the branch first using git client before calling platform
- Never modify the title or body returned by prDescription
- Pass through platform errors with context
- Preview message includes the PR title only, not the body 
  (body was already shown by prDescription)

## Error cases
- On default branch → PrCreatorError "Cannot create PR from default 
  branch. Switch to a feature branch first."
- prDescription returned cancelled → return cancelled, do not throw
- platform.createPR fails → wrap with platform name in PrCreatorError
- Branch push fails → PrCreatorError "Failed to push <branch>: <reason>"

## Tests required
- Pushes branch before calling platform
- Calls platform.createPR with correct title, body, source, target branches
- Returns created status with PR details on success
- Returns cancelled when prDescription is cancelled
- Returns cancelled when user says no to final confirmation
- Throws when run from default branch
- Wraps platform errors with helpful message
- dryrun mode does not call platform.createPR
- Mocks all dependencies (platform, prDescription, git, confirmation)
- Targets default branch (main) when no override given