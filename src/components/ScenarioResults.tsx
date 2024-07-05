import { RunningTaskBatchUpdate } from "../types";
import { Section } from "./Section";
import { StatsTable } from "./plots/StatsTable";
import { WhiskerPlot } from "./plots/WhiskerPlot";

export function Results(props: {
  scenarios: { name: string; updates: RunningTaskBatchUpdate[] }[];
}) {
  const itemStats = props.scenarios.map((scenario) => {
    return {
      name: scenario.name,
      values: scenario.updates
        .flatMap((update) => update.runs)
        .map((run) => run.duration),
    };
  });

  return (
    <Section title="Results">
      <StatsTable items={itemStats} />
      <WhiskerPlot items={itemStats} />
    </Section>
  );
}
