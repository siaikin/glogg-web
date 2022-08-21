import { WorkerManager, WorkerManagerOptions } from "../../../lib";
import { generateStringBytes } from "../../../lib/__mock__/mockUtils";
import { ToolWorker } from "../../../lib/worker/tool-worker/ToolWorker";
import { Blob } from "buffer";

describe("[WorkerManager] test cases", () => {
  const workerManager = new WorkerManager(
      new WorkerManagerOptions({ baseUrl: "./dist/esm/worker/bundle" })
    ),
    maxCpus = workerManager.maxWorkerSize,
    workerList: Array<ToolWorker> = [],
    { bytes, indexes } = generateStringBytes();

  beforeAll(() => {
    for (let i = maxCpus; i--; ) {
      workerList.push(workerManager.requestWorker("toolWorker"));
    }
  });

  it("correct call process should work", async function () {
    workerList.map(async (worker) => {
      const result = await worker.findLineSeparatorIndexAll(new Blob([bytes]));
      result.indexes.forEach((i, _index) => expect(i).toEqual(indexes[_index]));
    });
  });

  it("running workers reached the limit should throw error", function () {
    // another one
    expect(() => workerManager.requestWorker("toolWorker")).toThrow();
  });

  it("running workers reached the limit should throw error but you can release worker", function () {
    // release first worker
    workerManager.releaseWorker(workerList[0]);
    // and request another one
    expect(() =>
      workerList.push(workerManager.requestWorker("toolWorker"))
    ).not.toThrow();
  });

  afterAll(async () => {
    await workerManager.destroy();
  });
});
