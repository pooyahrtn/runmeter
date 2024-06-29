import { Text } from "ink";

type Props = {
  width: number;
  progress: number;
};
export function ProgressBar(props: Props) {
  const filled = Math.ceil(props.width * props.progress);
  return (
    <Text>
      {Array(filled).fill("#").join("")}
      {Array(props.width - filled)
        .fill("-")
        .join("")}
    </Text>
  );
}
