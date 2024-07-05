#!/usr/bin/env node

import * as toml from "toml";
import path from "node:path";
import { z } from "zod";
import { ConfigFile, RunningTaskBatchUpdate, configFileSchema } from "./types";
import { createScenarioRunner, warmupScenario } from "./runners";
import { Box, render } from "ink";
import { useEffect, useReducer } from "react";
import { State, reducer } from "./state";
import WarmupProgress from "./components/WarmupProgress";
import { ScenarioRunnerProgress } from "./components/ScenarioRunnerProgress";
import { parseDurationToSeconds } from "./utils";
import { Results } from "./components/ScenarioResults";
import fs from "fs/promises";

const CONFIG_FILE_NAME = "perfbench.toml";

const readConfig = (): Promise<ConfigFile> =>
  fs
    .readFile(path.resolve(process.cwd(), CONFIG_FILE_NAME))
    .then((buffer) => buffer.toString())
    .then((config) => toml.parse(config))
    .then(configFileSchema.parse);

function runScenarios(
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

function App(props: { config: ConfigFile }) {
  const { config } = props;

  const initialState: State = {
    current: "warmup",
    warmup: {
      type: "warmup",
      tasks: Object.keys(config.scenarios).map((name) => ({
        name,
        progress: 0,
      })),
    },
    running: {
      type: "running",
      tasks: Object.keys(config.scenarios).map((name) => ({
        name,
        updates: [],
        concurrentSessions: 0,
      })),
    },
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const warmups = Object.entries(config.scenarios).map(([name, scenario]) => {
      return warmupScenario(scenario, config, (progress) => {
        dispatch({ type: "warmup-progress", name, progress });
      });
    });

    Promise.all(warmups).then(() =>
      dispatch({ type: "phase-change", phase: "running" })
    );
  }, [config]);

  const currentState = state.current;
  // TODO: consider changing the runner output, to return a flat array of updates,
  // so the Scenario progressbar take care of the rendering.
  const maxScenarioProgressWidth = (process.stdout.columns ?? 80) - 13;

  useEffect(() => {
    if (currentState !== "running") {
      return;
    }

    const clearRunner = runScenarios(
      config,
      getIntervalDuration(config, maxScenarioProgressWidth),
      {
        onFinished() {
          dispatch({ type: "phase-change", phase: "finished" });
        },
        onScenarioUpdate(name, newUpdates, activeSessions) {
          dispatch({
            type: "scenario-update",
            task: {
              name,
              updates: [newUpdates],
              concurrentSessions: activeSessions,
            },
          });
        },
      }
    );

    return () => clearRunner();
  }, [config, currentState, maxScenarioProgressWidth]);

  return (
    <Box flexDirection="column">
      <WarmupProgress tasks={state.warmup.tasks} />
      {(state.current === "running" || state.current === "finished") && (
        <ScenarioRunnerProgress
          scenarios={state.running.tasks}
          maxStepsLength={maxScenarioProgressWidth}
        />
      )}
      {state.current === "finished" && (
        <Results scenarios={state.running.tasks} />
      )}
    </Box>
  );
}

function getIntervalDuration(config: ConfigFile, maxWidth: number) {
  const scenarioDurations = Object.values(config.scenarios).map((scenario) => {
    return parseDurationToSeconds(scenario.duration ?? config.duration);
  });
  const maxDuration = Math.max(...scenarioDurations);

  return Math.ceil((maxDuration / maxWidth) * 1000);
}

export async function main() {
  try {
    const config = await readConfig();
    render(<App config={config} />);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
    }
    throw error;
  }
}
