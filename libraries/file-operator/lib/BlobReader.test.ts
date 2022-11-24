import { WorkerManager, WorkerManagerOptions } from "./WorkerManager";
import { generateRandomStringBytes } from "./__mock__/mockUtils";
import { Blob } from "buffer";
import { LineByLineBlobReader } from "./LineByLineBlobReader";

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
    const reader = new LineByLineBlobReader({
      source: new Blob([bytes]),
      workerManager,
    });

    await reader.loaded;

    for (let i = 0; i < reader.totalLines; i++) {
      const results = await reader.readLines(i, 1);

      results.lines.forEach((text) => expect(text).toEqual(texts.shift()));
    }
  });

  afterAll(async () => {
    await workerManager.destroy();
  });
});
