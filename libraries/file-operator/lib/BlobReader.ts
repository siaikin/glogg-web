import { WorkerManager } from "./WorkerManager";
import { Blob as NodeBlob } from "buffer";
import { EventTarget } from "@siaikin/utils";

export class BlobReader extends EventTarget<BlobReaderEventListenerType> {
  constructor(options: BlobReaderOptions) {
    super();
    this._source = options.source;
    this._workerManager = options.workerManager;

    this._loadedPromise = this._loadBlob().then(() => {
      this.state = BlobReaderLoadState.LOADED;

      this.dispatchEventLite("blob-loaded", {
        data: {
          loaded: this._source.size,
          total: this._source.size,
        },
      });
    });
  }

  private readonly _loadedPromise: Promise<void>;

  private _source: Blob | NodeBlob;

  private _workerManager: WorkerManager;

  state = BlobReaderLoadState.IDLE;

  /**
   * number of lines
   */
  size = 0;

  lineSeparatorList: Array<number> = [];

  get loaded(): Promise<void> {
    if (this.state !== BlobReaderLoadState.LOADED) {
      return this._loadedPromise;
    } else {
      return Promise.resolve();
    }
  }

  /**
   * partially read files to reduce memory usage.
   * @private
   */
  private async _loadBlob(): Promise<void> {
    this.state = BlobReaderLoadState.LOADING;

    const worker = this._workerManager.requestWorker("toolWorker");

    const _splitSize = 1024 * 1024 * 10; // 10MB
    /**
     * if the data length not divisible, add one to the count(use {@link Math.ceil}).
     */
    const _splitCount = Math.ceil(this._source.size / _splitSize);

    // save line separator index list
    let lsIndexes: Array<number> = [];

    for (let i = 0; i < _splitCount; i++) {
      const _offset = i * _splitSize;
      const _endIndex = Math.min(_offset + _splitSize, this._source.size);

      const data = await worker.findLineSeparatorIndexAll(
        this._source.slice(_offset, _endIndex),
        _splitSize
      );

      lsIndexes = lsIndexes.concat(
        data.indexes.map((index) => index + _offset)
      );

      this.dispatchEventLite("blob-load-progress", {
        data: {
          loaded: _endIndex,
          total: this._source.size,
        },
      });
    }

    /**
     * convert line separator list to {@link Fragment} list.
     * {@link Fragment} just save reference({@link Blob}) of a part of file.
     */
    // const step = this._config.fragmentOptions.lines;
    // const len = lsIndexes.length;

    // for (let prevLSIndex = 0, startPosition = 0; prevLSIndex < len; ) {
    //   const nextLSIndex = Math.min(prevLSIndex + step, lsIndexes.length) - 1;
    //   const endPosition = lsIndexes[nextLSIndex] + 1;
    //   const fragment = new Fragment(
    //     this._source.slice(startPosition, endPosition),
    //     nextLSIndex - prevLSIndex,
    //     this._fragmentList.length,
    //     worker
    //   );
    //
    //   this._fragmentList.push(fragment);
    //
    //   startPosition = endPosition;
    //   prevLSIndex += step;
    // }

    this.lineSeparatorList = lsIndexes;
    this.size = lsIndexes.length;
  }
}

export class BlobReaderOptions {
  constructor(options: BlobReaderOptions) {
    this.source = options.source;
    this.workerManager = options.workerManager;
  }

  source: Blob | NodeBlob;
  workerManager: WorkerManager;
}

export enum BlobReaderLoadState {
  IDLE,
  LOADING,
  LOADED,
}

export interface BlobReaderEventListenerType {
  ["blob-load-progress"](data: { loaded: number; total: number }): void;
  ["blob-loaded"](data: { loaded: number; total: number }): void;
}
