import { createSemaphore } from "./semaphore";
import {
  RunScriptResult,
  ScenarioConfig,
  ScenarioRunnerUpdate,
  SharedConfig,
} from "./types";
import { parseDurationToSeconds } from "./utils";

const parseConfig = (
  scenario: ScenarioConfig,
  defaultConfig: SharedConfig
): Required<ScenarioConfig> => {
  const {
    duration = defaultConfig.duration,
    warmups = defaultConfig.warmups,
    max_concurrent_sessions = defaultConfig.max_concurrent_sessions ?? 10,
    script,
  } = scenario;

  return {
    duration,
    warmups,
    max_concurrent_sessions,
    script,
  };
};

export async function warmupScenario(
  scenario: ScenarioConfig,
  defaultConfig: SharedConfig,
  onProgress: (progress: number) => void
): Promise<RunScriptResult[]> {
  const { warmups, max_concurrent_sessions, script } = parseConfig(
    scenario,
    defaultConfig
  );

  const semaphore = createSemaphore({
    maxConcurrency: max_concurrent_sessions,
  });

  let completed = 0;

  const warmupRuns = Array.from({ length: warmups }, async () => {
    const result = await semaphore.withSemaphore(() => runScript(script));
    completed++;
    onProgress(completed / warmups);
    return result;
  });

  return Promise.all(warmupRuns);
}

export function createScenarioRunner(
  scenario: ScenarioConfig,
  defaultConfig: SharedConfig
) {
  const { max_concurrent_sessions, duration } = parseConfig(
    scenario,
    defaultConfig
  );

  const results: ScenarioRunnerUpdate[] = [{ time: 0, runs: [] }];

  let concurrentSessions = 0;

  // Run as many sessions as possible concurrently
  const interval = setInterval(() => {
    if (concurrentSessions < max_concurrent_sessions) {
      concurrentSessions++;
      runScript(scenario.script).then((result) => {
        concurrentSessions--;
        results[results.length - 1].runs.push(result);
      });
    }
  }, 10);

  /**
   * Called on every tick of the scenario.
   * Returns if the scenario has finished or not.
   */
  function tick(elapsedSeconds: number): boolean {
    if (elapsedSeconds > parseDurationToSeconds(duration)) {
      return true;
    }
    results.push({ time: elapsedSeconds, runs: [] });

    return false;
  }

  function report() {
    return results;
  }

  function stop() {
    clearInterval(interval);
  }

  return {
    tick,
    stop,
    report,
  };
}

const runScript = async (script: string): Promise<RunScriptResult> => {
  const args = script.trim().split(" ");
  const now = process.hrtime();
  const task = Bun.spawn(args, { stderr: "ignore", stdout: "ignore" });
  const exitCode = await task.exited;
  const duration = process.hrtime(now);
  return {
    successful: exitCode === 0,
    duration: duration[0] * 1e3 + duration[1] / 1e6,
  };
};
