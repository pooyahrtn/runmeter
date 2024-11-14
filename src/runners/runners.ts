import { createSemaphore } from "./semaphore";
import { RunScriptResult, ScenarioConfig, SharedConfig, Task } from "../types";
import { parseDurationToSeconds } from "../utils";
import { createShellTaskRunner } from "./shellTaskRunner";
import { createCurlTaskRunner } from "./curlTaskRunner";

const parseConfig = (
  scenario: ScenarioConfig,
  defaultConfig: SharedConfig
): Required<ScenarioConfig> => {
  const {
    duration = defaultConfig.duration,
    warmups = defaultConfig.warmups,
    max_concurrent_sessions = defaultConfig.max_concurrent_sessions ?? 10,
    script,
    parse_curl = defaultConfig.parse_curl ?? false,
  } = scenario;

  return {
    duration,
    warmups,
    max_concurrent_sessions,
    script,
    parse_curl,
  };
};

export async function warmupScenario(
  scenario: ScenarioConfig,
  defaultConfig: SharedConfig,
  onProgress: (progress: number) => void
): Promise<RunScriptResult[]> {
  const config = parseConfig(scenario, defaultConfig);
  const { warmups, max_concurrent_sessions } = config;

  const semaphore = createSemaphore({
    maxConcurrency: max_concurrent_sessions,
  });

  let completed = 0;

  const task = createTask(config);
  const args = await task.prepare();

  const warmupRuns = Array.from({ length: warmups }, async () => {
    const result = await semaphore.withSemaphore(() => task.run(...args));
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
  const config = parseConfig(scenario, defaultConfig);
  const { max_concurrent_sessions, duration } = config;

  const results: RunScriptResult[] = [];

  let concurrentSessions = 0;
  const task = createTask(config);

  // Run as many sessions as possible concurrently
  const interval = setInterval(() => {
    if (concurrentSessions < max_concurrent_sessions) {
      concurrentSessions++;
      task
        .prepare()
        .then((args) => task.run(...args))
        .then((result) => {
          concurrentSessions--;
          results.push(result);
        });
    }
  }, 10);

  /**
   * Called on every tick of the scenario.
   * Returns if the scenario has finished or not.
   */
  function isFinished(elapsedSeconds: number): boolean {
    if (elapsedSeconds > parseDurationToSeconds(duration)) {
      return true;
    }

    return false;
  }

  function flush() {
    const currentResults = [...results];
    results.length = 0;
    return currentResults;
  }

  function stop() {
    clearInterval(interval);
  }

  function getActiveSessions() {
    return concurrentSessions;
  }

  return {
    getActiveSessions,
    isFinished,
    stop,
    flush,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createTask = (scenario: Required<ScenarioConfig>): Task<any> => {
  if (scenario.parse_curl) {
    return createCurlTaskRunner(scenario.script);
  }
  return createShellTaskRunner(scenario.script);
};
