import { ToolWorker } from "../../../../lib/worker/tool-worker/ToolWorker";

describe("[ToolWorker] test cases", () => {
  const len = 128 * 1024,
    chatArr: Array<number> = [];
  let bytes: Uint8Array;

  beforeAll(() => {
    for (let i = 0; i < len; i++) chatArr.push(i % 128);

    bytes = Buffer.from(chatArr);
  });

  it("should work", async function () {
    const worker = new ToolWorker(
      "./dist/esm/worker/bundle/toolWorkerScript.cjs"
    );
    const data = await worker.findLineSeparatorIndex(bytes);
    expect(data.index >= 0).toBe(true);
    await worker.terminate();
  });
});
