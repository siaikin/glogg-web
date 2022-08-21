import {
  environmentType,
  EventTarget,
  EventTargetData,
  GetEventListenerParametersType,
  EnvironmentType,
} from "@siaikin/utils";
import { WorkerEvent, WorkerEventOptions } from "./WorkerTypeDef";

import { parentPort, TransferListItem } from "worker_threads";

declare let self: DedicatedWorkerGlobalScope;

export abstract class _AbstractWorkerScript<T = never> extends EventTarget<T> {
  protected constructor() {
    super();

    this._workerScopeInit();
  }

  dispatchWorkerEvent<D extends keyof T>(event: WorkerEvent<T, D>): boolean {
    const transfer = (event as WorkerEvent<T, D>).transfer;
    delete (event as WorkerEvent<T, D>).transfer;

    this.__workerScriptPostMessage(event, transfer);

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

  private _workerScopeInit(): void {
    this._receiveMainThreadMessage = this._receiveMainThreadMessage.bind(this);

    this.__workerScriptAddEventListener(
      "message",
      this._receiveMainThreadMessage
    );
  }

  private _receiveMainThreadMessage(ev: MessageEvent): void {
    EventTarget.prototype.dispatchEvent.call(this, ev.data);
  }

  private __workerScriptAddEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions
  ): void {
    switch (environmentType) {
      case EnvironmentType.NODE_THREAD:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parentPort?.addEventListener(type, listener, options);
        break;
      case EnvironmentType.BROWSER_WORKER:
        self.addEventListener(type, listener, options);
        break;
    }
  }

  private __workerScriptRemoveEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions
  ): void {
    switch (environmentType) {
      case EnvironmentType.NODE_THREAD:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parentPort?.removeEventListener(type, listener, options);
        break;
      case EnvironmentType.BROWSER_WORKER:
        self.removeEventListener(type, listener, options);
        break;
    }
  }

  private __workerScriptPostMessage(
    message: unknown,
    transfer?: Array<Transferable>
  ): void {
    switch (environmentType) {
      case EnvironmentType.NODE_THREAD:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parentPort?.postMessage(
          message,
          transfer as ReadonlyArray<TransferListItem>
        );
        break;
      case EnvironmentType.BROWSER_WORKER:
        self.postMessage(message, { transfer: transfer });
        break;
    }
  }
}
