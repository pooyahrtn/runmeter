import { Task } from "../types";
import { spawn } from "child_process";

export const createShellTaskRunner = (
  script: string
): Task<Parameters<typeof spawnProcess>> => {
  return {
    async prepare() {
      const args = parseCommand(script.trim().replace(/\\\n/g, " "));
      return [args[0], args.slice(1)] as const;
    },
    async run(...args) {
      const now = process.hrtime();
      const exitCode = await spawnProcess(...args);
      const duration = process.hrtime(now);
      return {
        successful: exitCode === 0,
        duration: duration[0] * 1e3 + duration[1] / 1e6,
      };
    },
  };
};

// Copied from https://stackoverflow.com/questions/39303787/parse-string-into-command-and-args-in-javascript
function parseCommand(command: string) {
  try {
    const re_next_arg =
      /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
    let next_arg = ["", "", command];
    const args = [];
    while ((next_arg = re_next_arg.exec(next_arg[2])!)) {
      let quoted_arg = next_arg[1];
      let unquoted_arg = "";
      while (quoted_arg.length > 0) {
        if (/^"/.test(quoted_arg)) {
          const quoted_part = /^"((?:\\.|[^"])*)"(.*)$/.exec(quoted_arg)!;
          unquoted_arg += quoted_part[1].replace(/\\(.)/g, "$1");
          quoted_arg = quoted_part[2];
        } else if (/^'/.test(quoted_arg)) {
          const quoted_part = /^'([^']*)'(.*)$/.exec(quoted_arg)!;
          unquoted_arg += quoted_part[1];
          quoted_arg = quoted_part[2];
        } else if (/^\\/.test(quoted_arg)) {
          unquoted_arg += quoted_arg[1];
          quoted_arg = quoted_arg.substring(2);
        } else {
          unquoted_arg += quoted_arg[0];
          quoted_arg = quoted_arg.substring(1);
        }
      }
      args[args.length] = unquoted_arg;
    }
    return args;
  } catch (e) {
    throw new Error(`Failed to parse command: ${command}`);
  }
}

const spawnProcess = async (
  command: string,
  args: string[]
): Promise<number | null> => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ["ignore", "ignore", "ignore"],
    });

    process.on("close", (code) => {
      resolve(code);
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
};
