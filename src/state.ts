import { ScenarioRunnerUpdate } from "./types";

type WarmupState = {
  type: "warmup";
  tasks: { name: string; progress: number }[];
};

type RunningState = {
  type: "running";
  tasks: { name: string; updates: ScenarioRunnerUpdate[] }[];
};

export type State = {
  current: "warmup" | "running" | "finished";
  warmup: WarmupState;
  running: RunningState;
};

export type Action =
  | { type: "phase-change"; phase: "warmup" | "running" | "finished" }
  | { type: "warmup-progress"; name: string; progress: number }
  | {
      type: "scenario-update";
      name: string;
      newUpdates: ScenarioRunnerUpdate;
    };

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "phase-change":
      return { ...state, current: action.phase };
    case "warmup-progress":
      return {
        ...state,
        warmup: {
          ...state.warmup,
          tasks: state.warmup.tasks.map((task) =>
            task.name === action.name
              ? { ...task, progress: action.progress }
              : task
          ),
        },
      };
    case "scenario-update":
      return {
        ...state,
        running: {
          ...state.running,
          tasks: state.running.tasks.map((task) =>
            task.name === action.name
              ? { ...task, updates: [...task.updates, action.newUpdates] }
              : task
          ),
        },
      };

    default:
      return state;
  }
};
