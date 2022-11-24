import { EventTarget } from "@siaikin/utils";
import { WorkerManager, WorkerManagerOptions } from "./WorkerManager";
import { BlobReaderOptions } from "./BlobReader";
import { Blob as NodeBlob } from "buffer";
import { LineByLineBlobReader } from "./LineByLineBlobReader";

export class BlobReaderFactory extends EventTarget {
  private static _instance?: BlobReaderFactory;

  static getInstance(
    ...args: ConstructorParameters<typeof BlobReaderFactory>
  ): BlobReaderFactory {
    if (!BlobReaderFactory._instance) {
      BlobReaderFactory._instance = new BlobReaderFactory(...args);
    }

    return BlobReaderFactory._instance;
  }

  constructor(
    options: BlobReaderFactoryOptions = new BlobReaderFactoryOptions()
  ) {
    super();

    if (BlobReaderFactory._instance) {
      throw new Error("instance existed, use [BlobReaderFactory.getInstance]");
    }

    this._options = options;

    this._workerManager = new WorkerManager(options);
  }

  private readonly _workerManager: WorkerManager;
  private _options: BlobReaderFactoryOptions;

  getReader(source: Blob | NodeBlob): LineByLineBlobReader {
    return new LineByLineBlobReader(
      new BlobReaderOptions({
        source,
        workerManager: this._workerManager,
      })
    );
  }
}

export class BlobReaderFactoryOptions extends WorkerManagerOptions {
  constructor(options: Partial<BlobReaderFactoryOptions> = {}) {
    super(options);
  }
}
