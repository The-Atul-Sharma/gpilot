import { z } from 'zod';
import type { AIProvider } from '../../core/ai/index.ts';
import type { GitClient } from '../../core/git/index.ts';
import type {
  Confirmation,
  ConfirmMode,
  ConfirmResult,
} from '../../core/confirmation/index.ts';

export interface PrDescriptionInput {
  ai: AIProvider;
  git: GitClient;
  confirmation: Confirmation;
  mode: ConfirmMode;
  template?: string;
}

export interface PrDescriptionResult {
  status: 'generated' | 'cancelled' | 'dryrun';
  title?: string;
  body?: string;
}

export class PrDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrDescriptionError';
  }
}

const RECENT_COMMIT_COUNT = 3;
const TITLE_MAX_LENGTH = 100;
const MAX_DIFF_CHARS = 60_000;
const MAX_FILES_LISTED = 50;

const DEFAULT_TEMPLATE = [
  '## Summary',
  '<one short paragraph describing what this PR does and why>',
  '',
  '## Changes',
  '- <bullet for each meaningful change>',
  '',
  '## Testing',
  '- <how this was tested or how a reviewer can verify>',
  '',
  '## Notes',
  '- <risks, follow-ups, or anything reviewers should pay attention to>',
].join('\n');

const inputSchema = z.object({
  ai: z.custom<AIProvider>(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      typeof (v as AIProvider).complete === 'function',
    'ai must be an AIProvider. Build one with createAIProvider() from core/ai.',
  ),
  git: z.custom<GitClient>(
    (v) =>
      v !== null &&
      typeof v === 'object' &&
      typeof (v as GitClient).getDiffAgainst === 'function',
    'git must be a GitClient. Build one with createGitClient() from core/git.',
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
  template: z
    .string()
    .min(1, 'template is empty. Pass a non-empty markdown string or omit to use the default template.')
    .optional(),
});

function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) return diff;
  return (
    `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated at ${MAX_DIFF_CHARS} chars]`
  );
}

function formatFiles(files: string[]): string {
  if (files.length === 0) return '(no files changed)';
  const listed = files.slice(0, MAX_FILES_LISTED).map((f) => `- ${f}`);
  if (files.length > MAX_FILES_LISTED) {
    listed.push(`- ...and ${files.length - MAX_FILES_LISTED} more`);
  }
  return listed.join('\n');
}

function buildPrompt(
  diff: string,
  files: string[],
  recentMessages: string[],
  template: string,
): string {
  const recentBlock = recentMessages.length
    ? `Recent commits on this branch (use them as the source of truth for intent):\n${recentMessages
        .map((m) => `- ${m}`)
        .join('\n')}\n\n`
    : '';
  return (
    `You are a senior engineer writing a pull request description.\n\n` +
    `Output a single JSON object with exactly two string fields: "title" and "body". ` +
    `No code fences, no preface, no commentary outside the JSON.\n\n` +
    `Rules:\n` +
    `- "title": imperative mood, <= ${TITLE_MAX_LENGTH} chars, no trailing period, no PR number prefix.\n` +
    `- "body": GitHub-flavored markdown that follows the template below exactly. Replace each placeholder with real content based on the diff. Drop any section that has no content rather than leaving placeholders.\n\n` +
    `Template:\n${template}\n\n` +
    recentBlock +
    `Files changed:\n${formatFiles(files)}\n\n` +
    `Diff:\n${truncateDiff(diff)}\n\n` +
    `Return ONLY the JSON object.`
  );
}

function stripCodeFence(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  }
  return text;
}

function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new PrDescriptionError(
      'AI did not return a JSON object. Choose regenerate, or switch providers/models in gitflow.config.yml.',
    );
  }
  return text.slice(start, end + 1);
}

const outputSchema = z.object({
  title: z
    .string()
    .min(1, 'title is empty')
    .max(
      TITLE_MAX_LENGTH,
      `title exceeds ${TITLE_MAX_LENGTH} chars`,
    ),
  body: z.string().min(1, 'body is empty'),
});

function parseOutput(raw: string): { title: string; body: string } {
  const cleaned = stripCodeFence(raw);
  const json = extractJsonObject(cleaned);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new PrDescriptionError(
      `AI output was not valid JSON (${reason}). Choose regenerate, or use edit to write the description manually.`,
    );
  }
  const result = outputSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0]?.message ?? 'invalid structure';
    throw new PrDescriptionError(
      `AI output failed validation: ${issue}. Choose regenerate, or use edit to write the description manually.`,
    );
  }
  return {
    title: result.data.title.trim(),
    body: result.data.body.trim(),
  };
}

function renderPreview(title: string, body: string): string {
  return `${title}\n\n${body}`;
}

function parseEdited(text: string): { title: string; body: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new PrDescriptionError(
      'Edited PR description is empty. Re-run the command and provide a title on the first line and body below.',
    );
  }
  const newlineIndex = trimmed.indexOf('\n');
  if (newlineIndex === -1) {
    return { title: trimmed, body: '' };
  }
  const title = trimmed.slice(0, newlineIndex).trim();
  const body = trimmed.slice(newlineIndex + 1).trim();
  if (!title) {
    throw new PrDescriptionError(
      'Edited PR description has no title on the first line. Put the PR title on line 1 and the body on line 3 onward.',
    );
  }
  return { title, body };
}

/**
 * Construct a PR description generator wired to AI, git, and a confirmation prompt.
 *
 * The returned object exposes a single `run()` method that:
 *   1. resolves the current and default branches (errors if they match),
 *   2. reads the diff and changed file list against the default branch,
 *   3. samples the last 3 commit messages for intent,
 *   4. asks the AI for a JSON {title, body} following the template, and
 *   5. shows the rendered preview via the confirmation module.
 *
 * On `yes` returns the generated title/body; on `edit` returns the edited
 * version (title parsed from the first line); on `regenerate` loops back
 * and re-asks the AI; on `no` returns cancelled. In `dryrun` mode the
 * description is generated and previewed but `status` is `'dryrun'`;
 * in `auto` mode the prompt is skipped and the result is returned as
 * `'generated'` unattended.
 *
 * @param input - AI provider, git client, confirmation helper, mode, and optional template override
 * @returns an object with `run(): Promise<PrDescriptionResult>`
 * @throws PrDescriptionError when run from the default branch, the diff is empty, or the AI output is unusable
 */
export function createPrDescription(input: PrDescriptionInput): {
  run(): Promise<PrDescriptionResult>;
} {
  const validated = inputSchema.parse(input);
  const { ai, git, confirmation, mode } = validated;
  const template = validated.template ?? DEFAULT_TEMPLATE;

  return {
    async run(): Promise<PrDescriptionResult> {
      const [currentBranch, defaultBranch] = await Promise.all([
        git.getCurrentBranch(),
        git.getDefaultBranch(),
      ]);

      if (!currentBranch) {
        throw new PrDescriptionError(
          'Not on a branch (detached HEAD). Check out a feature branch with git switch <branch>.',
        );
      }

      if (currentBranch === defaultBranch) {
        throw new PrDescriptionError(
          'Cannot generate PR description from default branch.',
        );
      }

      const [diff, files, recent] = await Promise.all([
        git.getDiffAgainst(defaultBranch),
        git.getChangedFiles(defaultBranch),
        git.getRecentCommits(RECENT_COMMIT_COUNT),
      ]);

      if (!diff.trim()) {
        throw new PrDescriptionError(
          `No changes between ${defaultBranch} and ${currentBranch}. Commit your work before generating a PR description.`,
        );
      }

      const recentMessages = recent.map((c) => c.message);

      while (true) {
        const prompt = buildPrompt(diff, files, recentMessages, template);
        const raw = await ai.complete(prompt, { temperature: 0.2 });
        const { title, body } = parseOutput(raw);

        if (mode === 'dryrun') {
          await confirmation.ask({ mode, preview: renderPreview(title, body) });
          return { status: 'dryrun', title, body };
        }

        const result: ConfirmResult = await confirmation.ask({
          mode,
          preview: renderPreview(title, body),
          actions: ['yes', 'no', 'edit', 'regenerate'],
        });

        if (result.action === 'yes') {
          return { status: 'generated', title, body };
        }

        if (result.action === 'edit') {
          const edited = parseEdited(result.editedText);
          return { status: 'generated', title: edited.title, body: edited.body };
        }

        if (result.action === 'regenerate') {
          continue;
        }

        return { status: 'cancelled' };
      }
    },
  };
}
