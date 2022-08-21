import { Event, randomString } from "@siaikin/utils";
import {
  EventTargetData,
  GetEventListenerParametersType,
} from "@siaikin/utils/types/IEventTarget";

export class WorkerEvent<T, D extends keyof T> extends Event<T, D> {
  constructor(
    type: D,
    message: EventTargetData<GetEventListenerParametersType<T, D>>,
    options?: Partial<WorkerEventOptions>
  ) {
    super(type, message);

    /**
     * 默认随机生成 cookie
     */
    this.cookie = options?.cookie || randomString(16);

    this.transfer = options?.transfer;
    this.duration = options?.duration;
  }

  /**
   * 标识事件的 key, 具有唯一性.
   *
   * 默认将随机生成一个 16位, 由数字大小写字母组成的字符串.
   */
  cookie: string;
  transfer?: Transferable[];
  duration?: number;
}

export interface WorkerEventOptions {
  transfer: Array<Transferable>;
  duration: number;
  cookie: string;
}

export enum WorkerState {
  IDLE,
  OCCUPY,
  DESTROY,
}
