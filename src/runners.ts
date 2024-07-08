import { createSemaphore } from "./semaphore";
import { RunScriptResult, ScenarioConfig, SharedConfig } from "./types";
import { parseDurationToSeconds } from "./utils";
import { spawn } from "child_process";

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

  const results: RunScriptResult[] = [];

  let concurrentSessions = 0;

  // Run as many sessions as possible concurrently
  const interval = setInterval(() => {
    if (concurrentSessions < max_concurrent_sessions) {
      concurrentSessions++;
      runScript(scenario.script).then((result) => {
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

const runScript = async (script: string): Promise<RunScriptResult> => {
  const args = parseCommand(script.trim().replace(/\\\n/g, " "));
  const now = process.hrtime();
  const exitCode = await spawnProcess(args[0], args.slice(1));
  const duration = process.hrtime(now);
  return {
    successful: exitCode === 0,
    duration: duration[0] * 1e3 + duration[1] / 1e6,
  };
};

const spawnProcess = async (
  command: string,
  args: string[]
): Promise<number | null> => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ["ignore", "ignore", "ignore"],
    });

    process.on("close", (code) => {
      resolve(code);
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
};

// Copied from https://stackoverflow.com/questions/39303787/parse-string-into-command-and-args-in-javascript
function parseCommand(command: string) {
  try {
    const re_next_arg =
      /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
    let next_arg = ["", "", command];
    const args = [];
    while ((next_arg = re_next_arg.exec(next_arg[2])!)) {
      let quoted_arg = next_arg[1];
      let unquoted_arg = "";
      while (quoted_arg.length > 0) {
        if (/^"/.test(quoted_arg)) {
          const quoted_part = /^"((?:\\.|[^"])*)"(.*)$/.exec(quoted_arg)!;
          unquoted_arg += quoted_part[1].replace(/\\(.)/g, "$1");
          quoted_arg = quoted_part[2];
        } else if (/^'/.test(quoted_arg)) {
          const quoted_part = /^'([^']*)'(.*)$/.exec(quoted_arg)!;
          unquoted_arg += quoted_part[1];
          quoted_arg = quoted_part[2];
        } else if (/^\\/.test(quoted_arg)) {
          unquoted_arg += quoted_arg[1];
          quoted_arg = quoted_arg.substring(2);
        } else {
          unquoted_arg += quoted_arg[0];
          quoted_arg = quoted_arg.substring(1);
        }
      }
      args[args.length] = unquoted_arg;
    }
    return args;
  } catch (e) {
    throw new Error(`Failed to parse command: ${command}`);
  }
}
