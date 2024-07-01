import * as mathjs from "mathjs";
import { Section } from "../Section";
import Table from "ink-table";

type ItemStats = {
  name: string;
  values: number[];
};
export function StatsTable(props: { items: ItemStats[] }) {
  const { items } = props;
  const tableData = items.map((item) => ({
    ...getItemStats(item.values),
    name: item.name,
  }));

  return <Section title="Stats">{<Table data={tableData} />}</Section>;
}

type ItemTableStat = {
  "25%": number;
  median: number;
  "75%": number;
  average: number;
  std: number;
};
function getItemStats(values: number[]): ItemTableStat {
  return {
    "25%": mathjs.quantileSeq(values, 0.25),
    median: mathjs.median(values),
    "75%": mathjs.quantileSeq(values, 0.75),
    average: mathjs.mean(values),
    std: mathjs.std(values) as unknown as number,
  };
}
