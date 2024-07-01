import { Text } from "ink";
import * as Chart from "asciichart";
import { CHART_HEIGHT, COlORS } from "../config";

type ItemStats = {
  name: string;
  values: number[];
};

export function DistributionPlot(props: { items: ItemStats[]; bins: number }) {
  const { items, bins } = props;
  const allItems = items.flatMap((item) => item.values);
  const minValue = Math.min(...allItems);
  const maxValue = Math.max(...allItems);
  const binWidth = (maxValue - minValue) / bins;
  const histograms = items.map((item) =>
    getHistogram(item.values, bins, minValue, binWidth)
  );

  return (
    <Text>
      {Chart.plot(histograms, {
        height: CHART_HEIGHT,
        colors: items.map((_, index) => COlORS[index][1]),
      })}
    </Text>
  );
}

function getHistogram(
  values: number[],
  bins: number,
  min: number,
  binWidth: number
) {
  const histogram = Array.from({ length: bins }, () => 0);

  for (const value of values) {
    const bin = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[bin]++;
  }

  return histogram;
}
