import { z } from 'zod';

export const pipelineStepSchema = z.object({
  id: z.string().min(1, 'PipelineStep.id must be a non-empty string. Pass the step id from the extension host.'),
  name: z.string().min(1, 'PipelineStep.name must be a non-empty string. Pass a human-readable label.'),
  status: z.enum(['idle', 'running', 'done', 'failed']),
});

export const inlineIssueSchema = z.object({
  id: z.string().min(1, 'InlineIssue.id must be a non-empty string. Use the platform comment id.'),
  file: z.string().min(1, 'InlineIssue.file must be a non-empty file path. Use the path from the review payload.'),
  line: z
    .number()
    .int()
    .nonnegative('InlineIssue.line must be a non-negative integer. Use 0 for file-level comments.'),
  severity: z.enum(['blocker', 'warning', 'info']),
  comment: z.string().min(1, 'InlineIssue.comment must be non-empty. Pass the review comment body.'),
  suggestedFix: z.string().optional(),
});

export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type InlineIssue = z.infer<typeof inlineIssueSchema>;

export const extensionMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pipelineUpdate'), steps: z.array(pipelineStepSchema) }),
  z.object({ type: z.literal('reviewComplete'), issues: z.array(inlineIssueSchema) }),
  z.object({
    type: z.literal('configUpdate'),
    provider: z.string().min(1, 'configUpdate.provider must be non-empty.'),
    model: z.string().min(1, 'configUpdate.model must be non-empty.'),
  }),
  z.object({
    type: z.literal('commandRunning'),
    command: z.string().min(1, 'commandRunning.command must be non-empty.'),
  }),
  z.object({
    type: z.literal('commandDone'),
    command: z.string().min(1, 'commandDone.command must be non-empty.'),
  }),
  z.object({
    type: z.literal('commandFailed'),
    command: z.string().min(1, 'commandFailed.command must be non-empty.'),
    error: z.string().min(1, 'commandFailed.error must be non-empty. Pass the error message from the host.'),
  }),
]);

export type ExtensionMessage = z.infer<typeof extensionMessageSchema>;

export const webviewMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('fixComment'),
    prId: z.string().min(1, 'fixComment.prId must be non-empty. Pass the current PR id from App state.'),
    commentId: z.string().min(1, 'fixComment.commentId must be non-empty. Use the InlineIssue id.'),
  }),
  z.object({
    type: z.literal('fixAllBlockers'),
    prId: z.string().min(1, 'fixAllBlockers.prId must be non-empty. Pass the current PR id from App state.'),
  }),
  z.object({
    type: z.literal('dismissComment'),
    commentId: z.string().min(1, 'dismissComment.commentId must be non-empty. Use the InlineIssue id.'),
  }),
  z.object({
    type: z.literal('switchModel'),
    provider: z.string().min(1, 'switchModel.provider must be non-empty. Use a value from the model list.'),
    model: z.string().min(1, 'switchModel.model must be non-empty. Use a value from the model list.'),
  }),
  z.object({ type: z.literal('generateClaudeMd') }),
  z.object({
    type: z.literal('generateSpec'),
    filePath: z.string().min(1, 'generateSpec.filePath must be non-empty. Pass the active editor file path.'),
  }),
  z.object({
    type: z.literal('runCommand'),
    command: z.string().min(1, 'runCommand.command must be non-empty. Pass the gitflow CLI subcommand.'),
  }),
]);

export type WebviewMessage = z.infer<typeof webviewMessageSchema>;
