import { Box, Text } from "ink";
import { RunningTask } from "../types";
import * as Chart from "asciichart";
import * as math from "mathjs";
import { Section } from "./Section";
import { CHART_HEIGHT, COlORS } from "./config";
import { Table } from "@tqman/ink-table";

export function ScenarioRunnerProgress(props: {
  scenarios: RunningTask[];
  maxStepsLength: number;
}) {
  const { scenarios, maxStepsLength } = props;

  // Forward-fill the averages (use the last known average if there are no runs in the update)
  const averages = scenarios.map((scenario) => {
    let lastKnownAverage = 0;

    return scenario.updates.map((update) => {
      if (update.runs.length > 0) {
        lastKnownAverage = math.mean(update.runs.map((run) => run.duration));
      }
      return lastKnownAverage;
    });
  });

  if (!averages.every((value) => value.length > 0)) {
    return;
  }
  const chartPadding = Math.max(
    ...averages.flat().map((value) => value.toFixed(2).toString().length),
    7
  );

  return (
    <Section title="Running">
      <Box flexDirection="column">
        <Text>
          {Chart.plot(averages, {
            colors: scenarios.map((_, index) => COlORS[index][1]),
            height: CHART_HEIGHT,
            padding: " ".repeat(chartPadding),
          })}
        </Text>
        <Text>
          {" ".repeat(chartPadding + 1)}┼{"─┬".repeat(maxStepsLength / 2)}
        </Text>
      </Box>
      <Table data={getStatusTable(scenarios)} />

      <Box flexDirection="row">
        {scenarios.map((scenario, index) => (
          <Box
            key={scenario.name}
            borderColor={COlORS[index][0]}
            borderStyle={"round"}
          >
            <Text color={COlORS[index][0]}>{scenario.name}</Text>
          </Box>
        ))}
      </Box>
    </Section>
  );
}

const getStatusTable = (tasks: RunningTask[]): Record<string, string>[] => {
  return tasks.map((task) => {
    const all = task.updates.flatMap((update) => update.runs);
    const finished = all.filter((run) => run.successful).length;
    const errors = all.filter((run) => !run.successful).length;

    return {
      name: task.name,
      "in progress": task.concurrentSessions.toString(),
      finished: finished.toString(),
      errors: errors.toString(),
    };
  });
};
