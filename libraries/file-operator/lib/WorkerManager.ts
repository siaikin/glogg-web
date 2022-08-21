import { ToolWorker } from "./worker/tool-worker/ToolWorker";
import { WorkerState } from "./worker/_internal/WorkerTypeDef";
import { getLogicalProcessorsSize } from "./utils";
import { EnvironmentType, environmentType } from "@siaikin/utils";

type WorkerType = {
  toolWorker: ToolWorker;
};

export class WorkerManager {
  private static _instance?: WorkerManager;

  static getInstance(
    args: ConstructorParameters<typeof WorkerManager>
  ): WorkerManager {
    if (!WorkerManager._instance) {
      WorkerManager._instance = new WorkerManager(...args);
    }

    return WorkerManager._instance;
  }

  constructor(options: WorkerManagerOptions) {
    if (WorkerManager._instance) {
      throw new Error("instance existed, use [WorkerManager.getInstance]");
    }

    this._baseUrl = options.baseUrl;
    this.maxWorkerSize = options.maxWorkerSize;
  }

  private readonly _baseUrl: string;
  private _workers: Map<keyof WorkerType, Array<WorkerType[keyof WorkerType]>> =
    new Map<keyof WorkerType, Array<WorkerType[keyof WorkerType]>>();
  readonly maxWorkerSize: number;

  requestWorker<T extends keyof WorkerType>(type: T): WorkerType[T] {
    const workerArr: Array<WorkerType[T]> = this._workers.get(type) || [];
    if (!this._workers.has(type)) this._workers.set(type, workerArr);

    const _worker = workerArr.find(
      (worker) => worker.state === WorkerState.IDLE
    );
    let result: WorkerType[T];

    if (_worker) {
      result = _worker;
    } else {
      result = this._createWorkerByWorkerType(type);
      workerArr.push(result);
    }

    result.state = WorkerState.OCCUPY;
    return result;
  }

  releaseWorker<T extends keyof WorkerType>(worker: WorkerType[T]): void {
    worker.state = WorkerState.IDLE;
  }

  async destroy(): Promise<void> {
    const workers = Array.from(this._workers.values()).flat(1);

    for (let i = workers.length; i--; ) {
      await workers[i].terminate();
    }
  }

  private _createWorkerByWorkerType<T extends keyof WorkerType>(
    type: T
  ): WorkerType[T] {
    const workerSize = Array.from(this._workers.values()).reduce(
      (previousValue, currentValue) => previousValue + currentValue.length,
      0
    );
    if (workerSize >= this.maxWorkerSize) {
      throw new Error(
        `current worker size has reached the limit(%${this.maxWorkerSize}`
      );
    }

    let result: WorkerType[T];
    let fileExtension;

    switch (environmentType) {
      case EnvironmentType.BROWSER:
        fileExtension = "js";
        break;
      case EnvironmentType.NODE:
        fileExtension = "cjs";
        break;
      default:
        throw new Error(`unknown environment type(${environmentType})`);
    }

    switch (type) {
      case "toolWorker":
        result = new ToolWorker(
          `${this._baseUrl}/toolWorkerScript.${fileExtension}`
        );
        break;
      default:
        throw new Error("unknown worker type");
    }

    return result;
  }
}

export class WorkerManagerOptions {
  constructor(options: Partial<WorkerManagerOptions> = {}) {
    this.baseUrl = options.baseUrl || "";
    this.maxWorkerSize = options.maxWorkerSize || getLogicalProcessorsSize();
  }

  /**
   * base path of load worker script file
   */
  baseUrl: string;
  maxWorkerSize: number;
}
