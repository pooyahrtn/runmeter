// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import parseCurl from "parse-curl";
import { Task } from "../types";

type ParseCurlOutput = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
};

export const createCurlTaskRunner = (
  script: string
): Task<[ParseCurlOutput]> => {
  return {
    async prepare() {
      return [parseCurl(script.trim().replace(/\\\n/g, " "))];
    },
    async run(arg) {
      const now = process.hrtime();
      const statusCode = await fetch(arg.url, {
        method: arg.method,
        headers: arg.headers,
        body: arg.body,
      }).then((res) => res.status);
      const duration = process.hrtime(now);
      return {
        duration: duration[0] * 1e3 + duration[1] / 1e6,
        successful: statusCode >= 200 && statusCode < 300,
      };
    },
  };
};
