import * as mathjs from "mathjs";
import Table from "./Table";

type ItemStats = {
  name: string;
  values: number[];
};
export function StatsTable(props: { items: ItemStats[] }) {
  const { items } = props;
  const tableData = items.map((item) => ({
    name: item.name,
    ...getItemStats(item.values),
  }));

  return <Table data={tableData} />;
}

type ItemTableStat = {
  "25%": string;
  median: string;
  "75%": string;
  average: string;
  std: string;
};
function getItemStats(values: number[]): ItemTableStat {
  return {
    "25%": formatNumber(mathjs.quantileSeq(values, 0.25)),
    median: formatNumber(mathjs.median(values)),
    "75%": formatNumber(mathjs.quantileSeq(values, 0.75)),
    average: formatNumber(mathjs.mean(values)),
    std: formatNumber(mathjs.std(values) as unknown as number, ""),
  };
}

const formatNumber = (n: number, postfix = "ms") =>
  n.toFixed(2) + " " + postfix;
