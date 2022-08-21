import { WorkerManager, WorkerManagerOptions } from "./WorkerManager";
import { generateRandomStringBytes } from "./__mock__/mockUtils";
import { BlobReader, BlobReaderFragmentOptions } from "./BlobReader";
import { Blob } from "buffer";

describe("[BlobReader] test case", () => {
  const workerManager = new WorkerManager(
    new WorkerManagerOptions({ baseUrl: "./dist/esm/worker/bundle" })
  );

  let bytes: Uint8Array, indexes: Array<number>, texts: Array<string>;

  beforeEach(() => {
    const info = generateRandomStringBytes(1024);
    bytes = info.bytes;
    indexes = info.indexes;
    texts = info.texts;
  });

  it("should search all line separator when instance created", async () => {
    const reader = new BlobReader({
      source: new Blob([bytes]),
      workerManager,
      fragmentOptions: new BlobReaderFragmentOptions(),
    });

    await reader.loaded;

    for (let i = 0; i < reader.size; i++) {
      const results = await reader.requestFragment(i).toTextArray();

      results.forEach((text) => expect(text).toEqual(texts.shift()));
    }
  });

  it("should create fragment based on the specified number of lines(fragmentOptions.lines)", async () => {
    const reader = new BlobReader({
      source: new Blob([bytes]),
      workerManager,
      fragmentOptions: {
        lines: 480,
      },
    });

    await reader.loaded;

    expect(reader.size).toEqual(Math.ceil(indexes.length / 480));
    for (let i = 0; i < reader.size; i++) {
      const results = await reader.requestFragment(i).toTextArray();

      results.forEach((text) => expect(text).toEqual(texts.shift()));
    }
  });

  afterAll(async () => {
    await workerManager.destroy();
  });
});
