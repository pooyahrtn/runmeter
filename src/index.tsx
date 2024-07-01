#!/usr/bin/env bun

import * as toml from "toml";
import path from "node:path";
import { z } from "zod";
import { ConfigFile, ScenarioRunnerUpdate, configFileSchema } from "./types";
import { createScenarioRunner, warmupScenario } from "./runners";
import { Box, render } from "ink";
import { useEffect, useReducer } from "react";
import { State, reducer } from "./state";
import { WarmupProgress } from "./components/WarmupProgress";
import { ScenarioRunnerProgress } from "./components/ScenarioRunnerProgress";
import { parseDurationToSeconds } from "./utils";
import { Results } from "./components/ScenarioResults";

const CONFIG_FILE_NAME = "perfbench.toml";

const readConfig = (): Promise<ConfigFile> =>
  Bun.file(path.resolve(process.cwd(), CONFIG_FILE_NAME))
    .text()
    .then((config) => toml.parse(config))
    .then(configFileSchema.parse);

function runScenarios(
  config: ConfigFile,
  callbacks: {
    onScenarioUpdate: (name: string, newUpdate: ScenarioRunnerUpdate) => void;
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
  const intervalDuration = 500;

  const interval = setInterval(() => {
    elapsedSeconds = elapsedSeconds + intervalDuration / 1000;

    const allFinished = scenarios.every(({ runner }) =>
      runner.isFinished(elapsedSeconds)
    );

    scenarios.forEach((scenario) => {
      callbacks.onScenarioUpdate(scenario.name, {
        runs: scenario.runner.flush(),
      });
    });

    if (allFinished) {
      callbacks.onFinished();
      clearInterval(interval);
    }
  }, intervalDuration);

  return () => {
    clearInterval(interval);
  };
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

  useEffect(() => {
    if (currentState !== "running") {
      return;
    }

    const clearRunner = runScenarios(config, {
      onFinished() {
        dispatch({ type: "phase-change", phase: "finished" });
      },
      onScenarioUpdate(name, newUpdates) {
        dispatch({ type: "scenario-update", name, newUpdates });
      },
    });

    return () => clearRunner();
  }, [config, currentState]);

  // useEffect(() => {
  //   if (currentState !== "finished") {
  //     return;
  //   }

  //   process.exit(0);
  // }, [currentState]);

  return (
    <Box flexDirection="column">
      <WarmupProgress tasks={state.warmup.tasks} />
      {(state.current === "running" || state.current === "finished") && (
        <ScenarioRunnerProgress
          scenarios={state.running.tasks}
          maxStepsLength={getMaxStepsLength(config) * 2}
        />
      )}
      {state.current === "finished" && (
        <Results scenarios={state.running.tasks} />
      )}
    </Box>
  );
}

function getMaxStepsLength(config: ConfigFile) {
  const scenarioDurations = Object.values(config.scenarios).map((scenario) => {
    return parseDurationToSeconds(scenario.duration ?? config.duration);
  });
  return Math.max(...scenarioDurations);
}

async function main() {
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

main();
