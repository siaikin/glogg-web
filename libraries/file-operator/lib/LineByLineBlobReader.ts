import { Blob as NodeBlob } from "buffer";
import {
  BlobReader,
  BlobReaderEventListenerType,
  BlobReaderOptions,
} from "./BlobReader";
import {
  clearMarkPoint,
  EventTarget,
  measureMarkPoint,
  randomString,
  setMarkPoint,
} from "@siaikin/utils";
import { toArrayBuffer } from "./utils";
import { WorkerManager } from "./WorkerManager";

export class LineByLineBlobReader extends EventTarget<LineByLineBlobReaderEventListenerType> {
  constructor(options: BlobReaderOptions) {
    super();

    this.blobReader = new BlobReader(options);
    this.blobReader.addEventListener("blob-load-progress", (ev) =>
      this.dispatchEvent(ev)
    );
    this.blobReader.addEventListener("blob-loaded", (ev) =>
      this.dispatchEvent(ev)
    );
    this.workerManager = options.workerManager;
    this.source = options.source;
  }

  /**
   * The total number of lines
   */
  get totalLines(): number {
    return this.blobReader.size;
  }

  get loaded(): Promise<void> {
    return this.blobReader.loaded;
  }

  private readonly blobReader: BlobReader;

  private readonly workerManager: WorkerManager;

  private readonly source: Blob | NodeBlob;

  private readonly textDecoder = new TextDecoder();

  get state() {
    return this.blobReader.state;
  }

  readStatus = LineByLineBlobReaderStatus.IDLE;

  /**
   * Read {@link length} lines starting at line {@link start}.
   * If reads to the end of the file it will return early.
   * @param start
   * @param length length > 0
   */
  async readLines(
    start: number,
    length: number
  ): Promise<ReadLinePerformanceDuration> {
    if (length <= 0) throw new Error("length must more then 0");

    const end = Math.min(start + length, this.blobReader.size);
    /**
     * `lineSeparatorList` 中存储文件中行分隔符的索引地址.
     * 因此第一行文本在文件中的索引为 [0, `lineSeparatorList[0]`],
     * 第二行为 [`lineSeparatorList[0] + 1`, `lineSeparatorList[1]`]... 以此类推得出规律如下:
     *
     * ```text
     * 0. 第 0 行文本索引为: [0, lineSeparatorList[0]]
     * 1. 第 1 行文本索引为: [lineSeparatorList[1 - 1] + 1, lineSeparatorList[1]]
     * 2. 第 2 行文本索引为: [lineSeparatorList[2 - 1] + 1, lineSeparatorList[2]]
     * ...
     * n. 第 n 行文本索引为: [lineSeparatorList[n - 1] + 1, lineSeparatorList[n]]
     * ```
     */
    const startIndex =
      start > 0 ? this.blobReader.lineSeparatorList[start - 1] + 1 : 0;
    const endIndex = this.blobReader.lineSeparatorList[end - 1];

    return this.toTextArray(
      this.source.slice(startIndex, endIndex + 1),
      this.blobReader.lineSeparatorList
        .slice(start, end)
        .map((index) => index - startIndex)
    );
  }

  private async arrayBuffer(
    blob: Blob | NodeBlob
  ): Promise<{ arrayBuffer: ArrayBuffer; loadArrayBufferDuration: number }> {
    const markPointName = `load-array-buffer ${randomString(16)}`;
    /**
     * 计算载入 Blob 的耗时
     */
    setMarkPoint(markPointName, 0);
    const arrayBuffer = await toArrayBuffer(blob);
    setMarkPoint(markPointName, 1);

    const loadArrayBufferDuration = measureMarkPoint(markPointName, 0, 1)[0];
    clearMarkPoint(markPointName);

    return {
      arrayBuffer,
      loadArrayBufferDuration,
    };
  }

  private async toTextArray(
    blob: Blob | NodeBlob,
    lsIndexes: Array<number>
  ): Promise<ReadLinePerformanceDuration> {
    switch (this.readStatus) {
      case LineByLineBlobReaderStatus.IDLE:
        break;
      default:
        await this.waitEvent("lines-read-complete");
    }

    this.readStatus = LineByLineBlobReaderStatus.LINES_READING;

    const { arrayBuffer, loadArrayBufferDuration } = await this.arrayBuffer(
      blob
    );

    const len = lsIndexes.length - 1;
    const result: Array<string> = [];

    const markPointName = `decode-text ${randomString(16)}`;

    setMarkPoint(markPointName, 0);

    result.push(
      this.textDecoder.decode(arrayBuffer.slice(0, lsIndexes[0] + 1))
    );
    for (let i = 0; i < len; i++) {
      result.push(
        this.textDecoder.decode(
          arrayBuffer.slice(lsIndexes[i] + 1, lsIndexes[i + 1] + 1)
        )
      );
    }

    setMarkPoint(markPointName, 1);
    const decodeTextDuration = measureMarkPoint(markPointName, 0, 1)[0];
    clearMarkPoint(markPointName);

    const textArray = result;

    this.readStatus = LineByLineBlobReaderStatus.IDLE;
    this.dispatchEventLite("lines-read-complete");

    return {
      loadArrayBufferDuration,
      decodeTextDuration,
      lines: textArray,
    };
  }
}

export interface LineByLineBlobReaderEventListenerType
  extends BlobReaderEventListenerType {
  ["lines-read-complete"](): void;
  ["lines-reading"](data: { loaded: number; total: number }): void;
}

export interface ReadLinePerformanceDuration {
  /**
   * time spent load Blob to ArrayBuffer.
   */
  loadArrayBufferDuration: number;
  /**
   * time spent converting ArrayBuffer to String.
   */
  decodeTextDuration: number;
  lines: Array<string>;
}

export enum LineByLineBlobReaderStatus {
  IDLE,
  LINES_READING,
}
