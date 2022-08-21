import { Blob as NodeBlob } from "buffer";
import {
  clearMarkPoint,
  EventTarget,
  measureMarkPoint,
  notUAN,
  setMarkPoint,
} from "@siaikin/utils";
import { toArrayBuffer } from "./utils";
import { ToolWorker } from "./worker/tool-worker/ToolWorker";

export class Fragment {
  constructor(
    blob: Blob | NodeBlob,
    lineNumber: number,
    index: number,
    private worker: ToolWorker
  ) {
    this._blob = blob;
    this.lineNumber = lineNumber;
    this.index = index;
  }

  private readonly _eventTarget = new EventTarget();
  private readonly _blob: Blob | NodeBlob;

  private status = FragmentStatus.IDLE;
  private _arrayBuffer?: ArrayBuffer;
  private _textArray?: Array<string>;

  index: number;
  lineNumber: number;
  lineIndexes?: Array<number>;

  /**
   * time spent load Blob to ArrayBuffer.
   * the value can be obtained after {@link arrayBuffer()} or {@link toTextArray()} resolve.
   */
  loadArrayBufferDuration?: number;
  /**
   * time spent converting ArrayBuffer to String.
   * the value can be obtained after {@link toTextArray()} resolve.
   */
  decodeTextDuration?: number;

  private async arrayBuffer(): Promise<ArrayBuffer> {
    if (notUAN(this._arrayBuffer)) {
      return this._arrayBuffer;
    }

    const markPointName = `load-array-buffer ${this.index}`;
    /**
     * 计算载入 Blob 的耗时
     */
    setMarkPoint(markPointName, 0);
    this._arrayBuffer = await toArrayBuffer(this._blob);
    setMarkPoint(markPointName, 1);

    this.loadArrayBufferDuration = measureMarkPoint(markPointName, 0, 1)[0];
    clearMarkPoint(markPointName);

    const data = await this.worker.findLineSeparatorIndexAll(
      this._blob,
      this._blob.size
    );
    this.lineIndexes = data.indexes;

    return this._arrayBuffer;
  }

  async toTextArray(): Promise<Array<string>> {
    switch (this.status) {
      case FragmentStatus.IDLE:
      case FragmentStatus.TEXT_DECODE_COMPLETE:
        break;
      default:
        await this._eventTarget.waitEvent("text-decode-complete");
    }

    if (this._textArray) return this._textArray;

    this.status = FragmentStatus.TEXT_DECODING;

    const decoder = new TextDecoder();
    this.status = FragmentStatus.ARRAY_BUFFER_LOADING;
    const ab = await this.arrayBuffer();
    this.status = FragmentStatus.ARRAY_BUFFER_LOADED;

    if (!notUAN(this.lineIndexes)) throw new Error();
    if (this.lineIndexes.length <= 0) throw new Error();

    const lsIndexes = this.lineIndexes;
    const len = lsIndexes.length - 1;
    const result: Array<string> = [];

    const markPointName = `decode-text ${this.index}`;

    setMarkPoint(markPointName, 0);

    result.push(decoder.decode(ab.slice(0, lsIndexes[0] + 1)));
    for (let i = 0; i < len; i++) {
      result.push(
        decoder.decode(ab.slice(lsIndexes[i] + 1, lsIndexes[i + 1] + 1))
      );
    }

    setMarkPoint(markPointName, 1);
    this.decodeTextDuration = measureMarkPoint(markPointName, 0, 1)[0];
    clearMarkPoint(markPointName);

    this._textArray = result;

    this.status = FragmentStatus.TEXT_DECODE_COMPLETE;
    this._eventTarget.dispatchEventLite("text-decode-complete");

    return this._textArray;
  }

  clear(): void {
    delete this._arrayBuffer;
    delete this._textArray;

    this.status = FragmentStatus.IDLE;
  }
}

export enum FragmentStatus {
  IDLE,
  TEXT_DECODING,
  TEXT_DECODE_COMPLETE,
  ARRAY_BUFFER_LOADING,
  ARRAY_BUFFER_LOADED,
}
