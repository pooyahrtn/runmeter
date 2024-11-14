import { z } from "zod";

const durationPattern = /^\d+(s|m|h)$/;

const sharedConfigSchema = z.object({
  warmups: z.number(),
  duration: z.string().refine((value) => durationPattern.test(value), {
    message: "Duration must be a number followed by 's', 'm', or 'h'",
  }),
  max_concurrent_sessions: z.number().optional(),
  parse_curl: z.boolean().optional(),
});

export type SharedConfig = z.infer<typeof sharedConfigSchema>;

const scenarioConfigSchema = z
  .object({
    script: z.string(),
  })
  .merge(sharedConfigSchema.partial());

export type ScenarioConfig = z.infer<typeof scenarioConfigSchema>;

export const configFileSchema = z
  .object({
    scenarios: z.record(scenarioConfigSchema),
  })
  .merge(sharedConfigSchema);

export type ConfigFile = z.infer<typeof configFileSchema>;

export type RunScriptResult = {
  successful: boolean;
  duration: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Task<Args extends any[]> = {
  prepare: () => Promise<Args>;
  run: (...args: Args) => Promise<RunScriptResult>;
};

export type RunningTaskBatchUpdate = { runs: RunScriptResult[] };

export type RunningTask = {
  name: string;
  updates: RunningTaskBatchUpdate[];
  concurrentSessions: number;
};
