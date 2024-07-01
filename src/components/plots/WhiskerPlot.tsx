import { Box, Text, render } from "ink";
import { zip } from "../../utils";

type ItemStats = {
  name: string;
  values: number[];
};

const PADDING = 10;

export function WhiskerPlot(props: { items: ItemStats[] }) {
  const stats = props.items.map((item) => getItemStats(item.values));

  const allLowerWhisker = Math.min(...stats.map((stat) => stat.lowerWhisker));
  const allUpperWhisker = Math.max(...stats.map((stat) => stat.upperWhisker));
  const chartHeight = allUpperWhisker - allLowerWhisker;

  const maxNameLength = Math.max(
    ...props.items.map((item) => item.name.length)
  );

  const scale = scaleValue(
    (process.stdout.columns - maxNameLength - PADDING) / chartHeight
  );

  return (
    <Box flexDirection="column">
      {zip(stats, props.items).map(([stat, scenario]) => (
        <Box key={scenario.name} flexDirection="row" alignItems="center">
          <Text>
            {" ".repeat(maxNameLength - scenario.name.length + 1)}
            {scenario.name}{" "}
          </Text>
          <ItemWhisker
            stats={stat}
            scale={scale}
            leftOffset={stat.lowerWhisker - allLowerWhisker}
          />
        </Box>
      ))}
    </Box>
  );
}

type ItemWhiskerStats = {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  lowerWhisker: number;
  upperWhisker: number;
};
function getItemStats(values: number[]): ItemWhiskerStats {
  const sortedValues = values.sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const q1 = sortedValues[Math.floor(sortedValues.length / 4)];
  const q3 = sortedValues[Math.floor((sortedValues.length * 3) / 4)];
  const iqr = q3 - q1;
  const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
  const upperWhisker = Math.min(max, q3 + 1.5 * iqr);

  return { min, max, median, q1, q3, lowerWhisker, upperWhisker };
}

function ItemWhisker(props: {
  stats: ItemWhiskerStats;
  leftOffset: number;
  scale: (value: number) => number;
}) {
  const {
    stats: { q1, q3, lowerWhisker, median, upperWhisker },
    scale,
    leftOffset,
  } = props;

  return (
    <Box
      alignItems="center"
      flexDirection="row"
      height={3}
      paddingLeft={scale(leftOffset)}
    >
      <Text>├</Text>
      <Text>{"─".repeat(scale(q1 - lowerWhisker))}</Text>
      <Box
        width={scale(q3 - q1)}
        borderStyle={"single"}
        height={3}
        flexDirection="column"
      >
        {scale(q3 - q1) > 1 && <Text>{" ".repeat(scale(median - q1))}│</Text>}
      </Box>
      <Text>{"─".repeat(scale(upperWhisker - q3))}</Text>
      <Text>┤</Text>
    </Box>
  );
}

const scaleValue = (scale: number) => (value: number) =>
  Math.round(value * scale);

const sampleData = [
  { name: "A", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { name: "B", values: [1, 2, 3, 4, 5, 8, 9, 10] },
];

render(<WhiskerPlot items={sampleData} />);
//
