#!/usr/bin/env node

import * as toml from "toml";
import path from "node:path";
import fs from "fs/promises";
import { ConfigFile, configFileSchema } from "./types";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { render } from "ink";
import { z } from "zod";
import { App } from "./app";

const CONFIG_FILE_NAME = "runmeter.toml";

const readConfig = (configPath?: string): Promise<ConfigFile> =>
  fs
    .readFile(path.resolve(process.cwd(), configPath ?? CONFIG_FILE_NAME))
    .then((buffer) => buffer.toString())
    .then((config) => toml.parse(config))
    .then(configFileSchema.parse);

type Args = {
  config?: string;
};
const parseArgs = (): Args => {
  const argv = yargs(hideBin(process.argv))
    .option("config", {
      alias: "c",
      type: "string",
      description: "Path to configuration file",
    })
    .parseSync();
  return argv;
};

export async function main() {
  try {
    const args = parseArgs();
    const config = await readConfig(args.config);
    render(<App config={config} />);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
    }
    throw error;
  }
}
