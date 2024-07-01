import { ScenarioRunnerUpdate } from "../types";
import { Section } from "./Section";
import { WhiskerPlot } from "./plots/WhiskerPlot";

export function Results(props: {
  scenarios: { name: string; updates: ScenarioRunnerUpdate[] }[];
}) {
  return (
    <Section title="Results">
      <WhiskerPlot
        items={props.scenarios.map((scenario) => {
          return {
            name: scenario.name,
            values: scenario.updates
              .flatMap((update) => update.runs)
              .map((run) => run.duration),
          };
        })}
      />
    </Section>
  );
}
