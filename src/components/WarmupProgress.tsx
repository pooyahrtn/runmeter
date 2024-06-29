import { Box, Text } from "ink";
import { ProgressBar } from "./ProgressBar";

export function WarmupProgress(props: {
  tasks: { name: string; progress: number }[];
}) {
  return (
    <Box flexDirection="column">
      <Text>Warming up the tasks</Text>

      {props.tasks.map((task) => (
        <Box key={task.name} flexDirection="row" gap={2} paddingX={2}>
          <Text>{task.name}</Text>
          <ProgressBar
            progress={task.progress}
            width={process.stdout.columns - task.name.length - 8}
          />
        </Box>
      ))}
    </Box>
  );
}
