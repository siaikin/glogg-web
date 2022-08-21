import { _AbstractWorker } from "../_internal/AbstractWorker";
import { ToolWorkerEventListenerType } from "./ToolWorkerConstant";
import { GetEventListenerParametersType, randomString } from "@siaikin/utils";
import { Blob as NodeBlob } from "buffer";

export class ToolWorker extends _AbstractWorker<ToolWorkerEventListenerType> {
  constructor(scriptURL: string | URL) {
    super(scriptURL);
  }

  async findLineSeparatorIndex(
    bytes: Uint8Array
  ): Promise<
    GetEventListenerParametersType<
      ToolWorkerEventListenerType,
      "find-line-separator-index-result"
    >
  > {
    this.dispatchWorkerEventLite(
      "find-line-separator-index",
      { data: { bytes } },
      { transfer: [bytes.buffer] }
    );

    const ev = await this.waitWorkEvent("find-line-separator-index-result");
    return ev.message.data;
  }

  async findLineSeparatorIndexAll(
    blob: Blob | NodeBlob,
    fragmentSize = 1024,
    timeout: number = 3 * 1e4
  ): Promise<
    GetEventListenerParametersType<
      ToolWorkerEventListenerType,
      "find-line-separator-index-all-result"
    >
  > {
    const cookie = randomString(16);

    this.dispatchWorkerEventLite(
      "find-line-separator-index-all",
      {
        data: { blob, step: fragmentSize },
      },
      { cookie }
    );

    return (
      await this.waitWorkEvent("find-line-separator-index-all-result", {
        timeout,
        cookie,
      })
    ).message.data;
  }

  async findLineSeparatorIndexAllNumber(
    blob: Blob | NodeBlob,
    fragmentSize = 1024,
    timeout: number = 3 * 1e4
  ): Promise<
    GetEventListenerParametersType<
      ToolWorkerEventListenerType,
      "find-number-of-line-separator-all-result"
    >
  > {
    this.dispatchWorkerEventLite("find-number-of-line-separator-all", {
      data: { blob, step: fragmentSize },
    });

    return (
      await this.waitWorkEvent("find-number-of-line-separator-all-result", {
        timeout,
      })
    ).message.data;
  }
}
