import { Box, Text } from "ink";
import { PropsWithChildren } from "react";

export function Section(
  props: PropsWithChildren<{ title: string; hideHorizontalBorder?: boolean }>
) {
  return (
    <Box paddingTop={1} flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle={"round"}
        borderLeft={props.hideHorizontalBorder ?? true}
        borderRight={props.hideHorizontalBorder ?? true}
        borderBottom={true}
        paddingTop={1}
      >
        <Box
          position="absolute"
          marginTop={-2}
          marginLeft={1}
          borderStyle={"round"}
        >
          <Text> {props.title} </Text>
        </Box>
        {props.children}
      </Box>
    </Box>
  );
}
