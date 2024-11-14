type Semaphore = {
  acquire: () => Promise<void>;
  release: () => void;
  withSemaphore: <T>(fn: () => Promise<T>) => Promise<T>;
};

type CreateSemaphoreOptions = {
  maxConcurrency: number;
  onRelease?: () => void;
  onLimitReached?: () => void;
};

export function createSemaphore(options: CreateSemaphoreOptions): Semaphore {
  let currentCount = 0;
  const tasks: (() => void)[] = [];

  function acquire(): Promise<void> {
    if (currentCount < options.maxConcurrency) {
      currentCount++;
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        tasks.push(resolve);
      });
    }
  }

  function release() {
    if (tasks.length > 0) {
      const nextResolve = tasks.shift();
      if (nextResolve) nextResolve();
    } else {
      currentCount--;
      if (options.onRelease) {
        options.onRelease();
      }
    }
  }

  async function withSemaphore<T>(fn: () => Promise<T>): Promise<T> {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  return {
    acquire,
    release,
    withSemaphore,
  };
}
