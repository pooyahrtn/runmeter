export const parseDurationToSeconds = (duration: string): number => {
  const [value, unit] = duration.match(/(\d+)(s|m|h)/)!.slice(1);
  switch (unit) {
    case "s":
      return Number(value);
    case "m":
      return Number(value) * 60;
    case "h":
      return Number(value) * 60 * 60;
    default:
      throw new Error("Invalid unit");
  }
};

export const average = (arr: number[]): number => {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

export const zip = <T, U>(arr1: T[], arr2: U[]): [T, U][] => {
  return arr1.map((value, index) => [value, arr2[index]]);
};
