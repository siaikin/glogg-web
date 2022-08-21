import {
  EnvironmentType,
  environmentType,
  EventTarget,
  EventTargetData,
  GetEventListenerParametersType,
  IEvent,
  randomString,
  Reportable,
} from "@siaikin/utils";
import { WorkerEvent, WorkerEventOptions, WorkerState } from "./WorkerTypeDef";
import * as worker_threads from "worker_threads";
import type {
  TransferListItem,
  WorkerOptions as NodeWorkerOptions,
} from "worker_threads";

const NodeWorker = worker_threads.Worker;
type NodeWorker = worker_threads.Worker;

export abstract class _AbstractWorker<T = never> extends Reportable<T> {
  protected constructor(scriptURL: string | URL, options?: WorkerOptions) {
    super();

    this._workerInit(scriptURL, options);
  }

  private _worker: Worker | NodeWorker;
  private readonly __timeoutKeys: Array<ReturnType<typeof setTimeout>> = [];

  state = WorkerState.IDLE;

  dispatchWorkerEvent<D extends keyof T>(event: WorkerEvent<T, D>): boolean {
    const transfer = (event as WorkerEvent<T, D>).transfer || [];
    delete (event as WorkerEvent<T, D>).transfer;

    this.__workerPostMessage(event, transfer);

    return true;
  }

  dispatchWorkerEventLite<D extends keyof T>(
    type: D,
    message: EventTargetData<GetEventListenerParametersType<T, D>>,
    options?: Partial<WorkerEventOptions>
  ): boolean {
    const event = new WorkerEvent(type, message, options);
    return this.dispatchWorkerEvent(event);
  }

  waitWorkEvent<D extends keyof T>(
    type: D,
    options: { timeout: number; cookie?: string } = { timeout: 3 * 1e4 }
  ): Promise<WorkerEvent<T, D>> {
    return new Promise<WorkerEvent<T, D>>((resolve, reject) => {
      const removeListener = this.addEventListener(type, (ev: IEvent<T, D>) => {
        if (options.cookie) {
          if ((ev as WorkerEvent<T, D>).cookie === options.cookie) {
            resolve(ev as WorkerEvent<T, D>);
            clearTimeout(key);
          }
        } else {
          resolve(ev as WorkerEvent<T, D>);
          clearTimeout(key);
        }
      });
      const key = setTimeout(() => {
        reject(new Error(`event ${type} timeout`));
        removeListener();
      }, options.timeout);
      this.__timeoutKeys.push(key);
    });
  }

  terminate(): Promise<void> {
    this.__workerRemoveEventListener(
      "message",
      this._receiveChildThreadMessage
    );

    this.__timeoutKeys.forEach((key) => clearTimeout(key));

    return this.__workerTerminate();
  }

  private _workerInit(scriptURL: string | URL, options?: WorkerOptions): void {
    this._worker = this.__createWorker(scriptURL, options);

    this._receiveChildThreadMessage =
      this._receiveChildThreadMessage.bind(this);

    this.__workerAddEventListener("message", this._receiveChildThreadMessage);
  }

  private __createWorker(
    scriptURL: string | URL,
    options?: WorkerOptions
  ): Worker | NodeWorker {
    let result: Worker | NodeWorker;

    switch (environmentType) {
      case EnvironmentType.NODE:
        result = new NodeWorker(scriptURL, options as NodeWorkerOptions);
        break;
      case EnvironmentType.BROWSER:
        result = new Worker(scriptURL, options);
        break;
      default:
        throw new Error(`unknown environment type(${environmentType})`);
    }

    return result;
  }

  private _receiveChildThreadMessage(ev: MessageEvent): void {
    switch (environmentType) {
      case EnvironmentType.NODE:
        EventTarget.prototype.dispatchEvent.call(this, ev);
        break;
      case EnvironmentType.BROWSER:
        EventTarget.prototype.dispatchEvent.call(this, ev.data);
        break;
    }
  }

  private __workerAddEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): void {
    switch (environmentType) {
      case EnvironmentType.NODE:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (this._worker as NodeWorker).addListener(type, listener, options);
        break;
      case EnvironmentType.BROWSER:
        (this._worker as Worker).addEventListener(type, listener, options);
        break;
    }
  }

  private __workerRemoveEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions
  ): void {
    switch (environmentType) {
      case EnvironmentType.NODE:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (this._worker as NodeWorker).removeListener(type, listener, options);
        break;
      case EnvironmentType.BROWSER:
        (this._worker as Worker).removeEventListener(type, listener, options);
        break;
    }
  }

  private __workerPostMessage(
    message: unknown,
    transfer?: Array<Transferable>
  ): void {
    switch (environmentType) {
      case EnvironmentType.NODE:
        (this._worker as NodeWorker).postMessage(
          message,
          transfer as Array<TransferListItem>
        );
        break;
      case EnvironmentType.BROWSER:
        (this._worker as Worker).postMessage(message, { transfer });
        break;
    }
  }

  private __workerTerminate(): Promise<void> {
    let result: Promise<void> = Promise.resolve();

    switch (environmentType) {
      case EnvironmentType.NODE:
        result = (this._worker as NodeWorker).terminate().then(() => undefined);

        if (process.env["NODE_ENV"] === "test") {
          result = result.then(
            () => new Promise((resolve) => setTimeout(resolve, 0))
          );
        }

        break;
      case EnvironmentType.BROWSER:
        (this._worker as Worker).terminate();
        break;
    }

    return result.then(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
  }
}
