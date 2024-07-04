import { Box, Text } from "ink";
import { ProgressBar } from "./ProgressBar";
import { Section } from "./Section";
import React from "react";

function WarmupProgress(props: {
  tasks: { name: string; progress: number }[];
}) {
  const maxNameLength = Math.max(
    ...props.tasks.map((task) => task.name.length)
  );

  return (
    <Section title="Warmup">
      {props.tasks.map((task) => (
        <Box key={task.name} flexDirection="row" gap={2} paddingX={1}>
          <Text>{" ".repeat(maxNameLength - task.name.length)}</Text>
          <Text>{task.name}</Text>
          <ProgressBar
            progress={task.progress}
            width={process.stdout.columns - maxNameLength - 8}
          />
        </Box>
      ))}
    </Section>
  );
}

export default React.memo(WarmupProgress);
