import { WorkerState } from "../_internal/WorkerTypeDef";
import { LineSeparatorType } from "../../utils";
import { Blob as NodeBlob } from "buffer";

export interface ToolWorkerEventListenerType {
  ["state-change"](data: { state: WorkerState; oldState: WorkerState }): void;
  ["message"](data: { data: string }): void;
  ["find-line-separator-index"](data: { bytes: Uint8Array }): void;
  ["find-line-separator-index-result"](data: { index: number }): void;
  ["find-line-separator-index-all"](data: {
    blob: Blob | NodeBlob;
    step?: number;
    lineSeparatorType?: LineSeparatorType;
  }): void;
  ["find-line-separator-index-all-progress"](data: {
    searched: number;
    total: number;
  }): void;
  ["find-line-separator-index-all-result"](data: {
    indexes: Array<number>;
    searched: number;
    total: number;
  }): void;
  ["find-number-of-line-separator-all"](data: {
    blob: Blob | NodeBlob;
    step?: number;
    lineSeparatorType?: LineSeparatorType;
  }): void;
  ["find-number-of-line-separator-all-progress"](data: {
    searched: number;
    total: number;
  }): void;
  ["find-number-of-line-separator-all-result"](data: {
    numberOfLineSeparator: number;
    searched: number;
    total: number;
  }): void;
  ["error"](data: { detail: string }): void;
}

// export enum ToolWorkerEventType {
//   MESSAGE = 'message',
//   ERROR = 'error',
//   STATE_CHANGE = 'state-change',
//   FIND_LINE_SEPARATOR_INDEX = 'find-line-separator-index',
//   FIND_LINE_SEPARATOR_INDEX_RESULT = 'find-line-separator-index-result',
// }
