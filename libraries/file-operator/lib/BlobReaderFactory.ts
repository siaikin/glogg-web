import { EventTarget } from "@siaikin/utils";
import { WorkerManager, WorkerManagerOptions } from "./WorkerManager";
import {
  BlobReader,
  BlobReaderFragmentOptions,
  BlobReaderOptions,
} from "./BlobReader";
import { Blob as NodeBlob } from "buffer";

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

  getReader(source: Blob | NodeBlob): BlobReader {
    return new BlobReader(
      new BlobReaderOptions({
        source,
        workerManager: this._workerManager,
        fragmentOptions: this._options.readerFragment,
      })
    );
  }
}

export class BlobReaderFactoryOptions extends WorkerManagerOptions {
  constructor(options: Partial<BlobReaderFactoryOptions> = {}) {
    super(options);

    this.readerFragment =
      options.readerFragment || new BlobReaderFragmentOptions();
  }

  readerFragment: BlobReaderFragmentOptions;
}
