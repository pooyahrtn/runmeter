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

  return (
    <Box>
      {averages.every((value) => value.length > 0) && (
        <Text>
          {Chart.plot(averages, {
            colors: scenarios.map((_, index) => COlORS[index]),
          })}
        </Text>
      )}
    </Box>
  );
}

const COlORS = [
  Chart.red,
  Chart.blue,
  Chart.green,
  Chart.yellow,
  Chart.magenta,
  Chart.cyan,
];
