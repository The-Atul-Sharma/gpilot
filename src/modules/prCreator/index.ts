import { z } from 'zod';
import chalk from 'chalk';
import type { GitClient } from '../../core/git/index.ts';
import type {
  Confirmation,
  ConfirmMode,
  ConfirmResult,
} from '../../core/confirmation/index.ts';
import type { createPrDescription } from '../prDescription/index.ts';

export interface CreatePRInput {
  title: string;
  body: string;
  sourceBranch: string;
  targetBranch: string;
}

export interface CreatedPR {
  id: string;
  url: string;
  number: number;
}

export interface GitPlatform {
  readonly name?: string;
  createPR(input: CreatePRInput): Promise<CreatedPR>;
}

export type PrCreatorGitClient = GitClient & {
  push(branch: string): Promise<void>;
};

export interface PrCreatorInput {
  platform: GitPlatform;
  prDescription: ReturnType<typeof createPrDescription>;
  git: PrCreatorGitClient;
  confirmation: Confirmation;
  mode: ConfirmMode;
}

export interface PrCreatorResult {
  status: 'created' | 'cancelled' | 'dryrun';
  pr?: CreatedPR;
}

export class PrCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrCreatorError';
  }
}

const inputSchema = z.object({
  platform: z.custom<GitPlatform>(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      typeof (v as GitPlatform).createPR === 'function',
    'platform must be a GitPlatform with createPR(). Build one with createGithubPlatform() or createAzureDevopsPlatform().',
  ),
  prDescription: z.custom<ReturnType<typeof createPrDescription>>(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      typeof (v as { run?: unknown }).run === 'function',
    'prDescription must be a PrDescription with run(). Build one with createPrDescription() from modules/prDescription.',
  ),
  git: z.custom<PrCreatorGitClient>(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      typeof (v as PrCreatorGitClient).getCurrentBranch === 'function' &&
      typeof (v as PrCreatorGitClient).getDefaultBranch === 'function' &&
      typeof (v as PrCreatorGitClient).push === 'function',
    'git must be a GitClient that supports push(branch). Build one with createGitClient() from core/git.',
  ),
  confirmation: z.custom<Confirmation>(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      typeof (v as Confirmation).ask === 'function',
    'confirmation must be a Confirmation. Build one with createConfirmation() from core/confirmation.',
  ),
  mode: z.enum(['interactive', 'auto', 'dryrun'], {
    message:
      'mode must be one of "interactive", "auto", or "dryrun". Pass mode from the CLI flag (--auto / --dry-run).',
  }),
});

function platformLabel(platform: GitPlatform): string {
  return platform.name && platform.name.trim().length > 0
    ? platform.name
    : 'platform';
}

/**
 * Construct a PR creator wired to a git platform, a description generator,
 * a git client, and a confirmation prompt.
 *
 * The returned object exposes a single `run()` method that:
 *   1. resolves the current and default branches (errors if they match),
 *   2. pushes the current branch to the remote via `git.push`,
 *   3. invokes `prDescription.run()` to get the title and body,
 *   4. previews the resulting PR title via the confirmation module, and
 *   5. on confirmation, calls `platform.createPR` with title, body,
 *      source branch (current), and target branch (default).
 *
 * The title and body returned by prDescription are passed through unchanged.
 * In `dryrun` mode the platform is never called and the result status is
 * `'dryrun'`. In `auto` mode the prompt is skipped and creation proceeds.
 *
 * @param input - platform, prDescription, git client (with push), confirmation, and mode
 * @returns an object with `run(): Promise<PrCreatorResult>`
 * @throws PrCreatorError when run from the default branch, when the branch
 *   push fails, or when the platform's createPR call fails
 */
export function createPrCreator(input: PrCreatorInput): {
  run(): Promise<PrCreatorResult>;
} {
  const validated = inputSchema.parse(input);
  const { platform, prDescription, git, confirmation, mode } = validated;

  return {
    async run(): Promise<PrCreatorResult> {
      const [currentBranch, defaultBranch] = await Promise.all([
        git.getCurrentBranch(),
        git.getDefaultBranch(),
      ]);

      if (!currentBranch) {
        throw new PrCreatorError(
          'Not on a branch (detached HEAD). Switch to a feature branch with git switch <branch> before opening a PR.',
        );
      }

      if (currentBranch === defaultBranch) {
        throw new PrCreatorError(
          'Cannot create PR from default branch. Switch to a feature branch first.',
        );
      }

      try {
        await git.push(currentBranch);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new PrCreatorError(
          `Failed to push ${currentBranch}: ${reason}. Check your remote and credentials, then re-run.`,
        );
      }

      const description = await prDescription.run();

      if (description.status === 'cancelled') {
        return { status: 'cancelled' };
      }

      if (!description.title || !description.body) {
        throw new PrCreatorError(
          'prDescription returned without a title or body. Re-run with mode=interactive and confirm or edit the description.',
        );
      }

      const { title, body } = description;
      const preview = `About to open PR: ${chalk.bold(title)}`;

      const confirmation_result: ConfirmResult = await confirmation.ask({
        mode,
        preview,
        actions: ['yes', 'no'],
      });

      if (mode === 'dryrun') {
        return { status: 'dryrun' };
      }

      if (confirmation_result.action !== 'yes') {
        return { status: 'cancelled' };
      }

      try {
        const pr = await platform.createPR({
          title,
          body,
          sourceBranch: currentBranch,
          targetBranch: defaultBranch,
        });
        return { status: 'created', pr };
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new PrCreatorError(
          `${platformLabel(platform)} failed to create PR: ${reason}. Verify your platform credentials and that the source branch is pushed.`,
        );
      }
    },
  };
}
