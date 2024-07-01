import { Box, Text } from "ink";
import { PropsWithChildren } from "react";

export function Section(props: PropsWithChildren<{ title: string }>) {
  return (
    <Box paddingTop={1} flexDirection="column">
      <Box flexDirection="column" borderStyle={"round"} paddingTop={1}>
        <Box position="absolute" marginTop={-2} borderStyle={"round"}>
          <Text> {props.title} </Text>
        </Box>
        {props.children}
      </Box>
    </Box>
  );
}
