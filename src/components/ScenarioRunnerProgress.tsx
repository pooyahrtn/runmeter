import { Box, Text } from "ink";
import { ScenarioRunnerUpdate } from "../types";
import * as Chart from "asciichart";
import * as math from "mathjs";

export function ScenarioRunnerProgress(props: {
  scenarios: { name: string; updates: ScenarioRunnerUpdate[] }[];
}) {
  const { scenarios } = props;

  const averages = scenarios.map((scenario) =>
    scenario.updates
      .filter((value) => value.runs.length > 0)
      .map((value) => math.mean(value.runs.map((run) => run.duration)))
  );

  if (!averages.every((value) => value.length > 0)) {
    return;
  }

  return (
    <Box paddingY={1} flexDirection="column">
      <Text>
        {Chart.plot(averages, {
          colors: scenarios.map((_, index) => COlORS[index][1]),
          height: CHART_HEIGHT,
        })}
      </Text>
      <Box flexDirection="row" paddingY={1}>
        {scenarios.map((scenario, index) => (
          <Box
            key={scenario.name}
            borderColor={COlORS[index][0]}
            borderStyle={"round"}
            paddingX={1}
          >
            <Text color={COlORS[index][0]}>{scenario.name}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const COlORS = [
  ["red", Chart.red],
  ["blue", Chart.blue],
  ["green", Chart.green],
  ["yellow", Chart.yellow],
  ["magenta", Chart.magenta],
];

const CHART_HEIGHT = 15;
