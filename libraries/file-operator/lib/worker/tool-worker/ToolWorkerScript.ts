import { clearMarkPoint, measureMarkPoint, setMarkPoint } from "@siaikin/utils";
import type { Blob as NodeBlob } from "buffer";
import { _AbstractWorkerScript } from "../_internal/AbstractWorkerScript";
import { ToolWorkerEventListenerType } from "./ToolWorkerConstant";
import {
  LineSeparatorType,
  toArrayBuffer,
  utf8FindLineSeparatorIndex,
  utf8FindLineSeparatorIndexGlobal,
  utf8FindLineSeparatorIndexGlobalNumber,
} from "../../utils";
import { WorkerEvent } from "../_internal/WorkerTypeDef";

class ToolWorkerScript extends _AbstractWorkerScript<ToolWorkerEventListenerType> {
  constructor() {
    super();

    this._scriptInit();
  }

  private _scriptInit(): void {
    this.addEventListener("find-line-separator-index", (ev) => {
      const cookie = (
        ev as WorkerEvent<
          ToolWorkerEventListenerType,
          "find-line-separator-index"
        >
      ).cookie;

      const { bytes } = ev.message.data;
      const index = utf8FindLineSeparatorIndex(bytes);

      this.dispatchWorkerEventLite(
        "find-line-separator-index-result",
        { data: { index } },
        {
          transfer: [bytes.buffer],
          cookie,
        }
      );
    });

    this.addEventListener("find-line-separator-index-all", async (ev) => {
      const cookie = (
        ev as WorkerEvent<
          ToolWorkerEventListenerType,
          "find-line-separator-index-all"
        >
      ).cookie;
      const { blob, step, lineSeparatorType } = ev.message.data,
        bytes = new Uint8Array(await toArrayBuffer(blob)),
        _step = step || 1024,
        indexes: Array<number> = [],
        len = bytes.byteLength,
        markName = "find-line-separator-index-all";
      let prevMarkPointIndex = 0;

      setMarkPoint(markName, prevMarkPointIndex);
      utf8FindLineSeparatorIndexGlobal(
        bytes,
        0,
        _step,
        indexes,
        lineSeparatorType || LineSeparatorType.LF
      );
      for (let i = _step; i < len; i += _step) {
        setMarkPoint(markName, i);
        this.dispatchWorkerEventLite(
          "find-line-separator-index-all-progress",
          { data: { searched: i, total: len } },
          {
            duration: measureMarkPoint(markName, prevMarkPointIndex, i)[0],
            cookie,
          }
        );
        prevMarkPointIndex = i;

        utf8FindLineSeparatorIndexGlobal(
          bytes,
          i,
          _step,
          indexes,
          lineSeparatorType || LineSeparatorType.LF
        );
      }
      setMarkPoint(markName, prevMarkPointIndex + 1);

      this.dispatchWorkerEventLite(
        "find-line-separator-index-all-progress",
        { data: { searched: len, total: len } },
        {
          duration: measureMarkPoint(
            markName,
            prevMarkPointIndex,
            prevMarkPointIndex + 1
          )[0],
          cookie,
        }
      );
      this.dispatchWorkerEventLite(
        "find-line-separator-index-all-result",
        { data: { indexes, searched: len, total: len } },
        {
          transfer: [bytes.buffer],
          duration: measureMarkPoint(markName, 0, prevMarkPointIndex + 1)[0],
          cookie,
        }
      );
      clearMarkPoint(markName);
    });

    this.addEventListener("find-number-of-line-separator-all", async (ev) => {
      const cookie = (
        ev as WorkerEvent<
          ToolWorkerEventListenerType,
          "find-number-of-line-separator-all"
        >
      ).cookie;
      const { blob, step, lineSeparatorType } = ev.message.data;
      await this.handleFindNumberOfLineSeparatorAll(
        cookie,
        blob,
        step,
        lineSeparatorType
      );
    });
  }

  private async handleFindNumberOfLineSeparatorAll(
    cookie: string,
    blob: Blob | NodeBlob,
    step?: number,
    lineSeparatorType?: LineSeparatorType
  ) {
    const bytes = new Uint8Array(await toArrayBuffer(blob)),
      _step = step || 1024,
      len = bytes.byteLength,
      markName = "find-number-of-line-separator-all";
    let prevMarkPointIndex = 0;
    let numberOfLS = 0;

    // setMarkPoint(markName, prevMarkPointIndex);
    // numberOfLS += utf8FindLineSeparatorIndexGlobalNumber(
    //   bytes,
    //   0,
    //   _step,
    //   lineSeparatorType || LineSeparatorType.LF
    // );
    for (let i = 0; i < len; i += _step) {
      setMarkPoint(markName, i);
      if (i > 0) {
        this.dispatchWorkerEventLite(
          "find-number-of-line-separator-all-progress",
          { data: { searched: i, total: len } },
          {
            duration: measureMarkPoint(markName, prevMarkPointIndex, i)[0],
            cookie,
          }
        );
        prevMarkPointIndex = i;
      }

      numberOfLS += utf8FindLineSeparatorIndexGlobalNumber(
        bytes,
        i,
        _step,
        lineSeparatorType || LineSeparatorType.LF
      );
    }
    setMarkPoint(markName, prevMarkPointIndex + 1);

    this.dispatchWorkerEventLite(
      "find-number-of-line-separator-all-progress",
      { data: { searched: len, total: len } },
      {
        duration: measureMarkPoint(
          markName,
          prevMarkPointIndex,
          prevMarkPointIndex + 1
        )[0],
        cookie,
      }
    );
    this.dispatchWorkerEventLite(
      "find-number-of-line-separator-all-result",
      {
        data: { numberOfLineSeparator: numberOfLS, searched: len, total: len },
      },
      {
        transfer: [bytes.buffer],
        duration: measureMarkPoint(markName, 0, prevMarkPointIndex + 1)[0],
        cookie,
      }
    );
    clearMarkPoint(markName);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toolWorkerScript = new ToolWorkerScript();
