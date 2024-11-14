import { ConfigFile, RunningTaskBatchUpdate } from "../types";
import { createScenarioRunner } from "./runners";

export function runScenarios(
  config: ConfigFile,
  intervalDuration: number,
  callbacks: {
    onScenarioUpdate: (
      name: string,
      newUpdate: RunningTaskBatchUpdate,
      activeSessions: number
    ) => void;
    onFinished: () => void;
  }
) {
  const scenarios = Object.entries(config.scenarios).map(
    ([name, scenario]) => ({
      name,
      runner: createScenarioRunner(scenario, config),
    })
  );

  let elapsedSeconds = 0;

  const interval = setInterval(() => {
    elapsedSeconds = elapsedSeconds + intervalDuration / 1000;

    const allFinished = scenarios.every(({ runner }) =>
      runner.isFinished(elapsedSeconds)
    );

    scenarios.forEach((scenario) => {
      callbacks.onScenarioUpdate(
        scenario.name,
        {
          runs: scenario.runner.flush(),
        },
        scenario.runner.getActiveSessions()
      );
    });

    if (allFinished) {
      stop();
      callbacks.onFinished();
    }
  }, intervalDuration);

  const stop = () => {
    scenarios.forEach(({ runner }) => runner.stop());
    clearInterval(interval);
  };

  return stop;
}
