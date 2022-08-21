import { EnvironmentType, environmentType } from "@siaikin/utils";
import * as os from "os";
import { Blob as NodeBlob } from "buffer";

const { cpus } = os;

export function getLogicalProcessorsSize(): number {
  switch (environmentType) {
    case EnvironmentType.BROWSER:
    case EnvironmentType.BROWSER_WORKER:
      return navigator.hardwareConcurrency;
    case EnvironmentType.NODE:
    case EnvironmentType.NODE_THREAD:
      return cpus().length;
    default:
      return 4;
  }
}

export async function toArrayBuffer(
  blobOrBuffer: Blob | NodeBlob
): Promise<ArrayBuffer> {
  switch (environmentType) {
    case EnvironmentType.BROWSER:
    case EnvironmentType.BROWSER_WORKER:
      return blobReadAsArrayBuffer(blobOrBuffer as Blob);
      break;
    case EnvironmentType.NODE:
    case EnvironmentType.NODE_THREAD:
      return nodeBlobReadAsArrayBuffer(blobOrBuffer as NodeBlob);
      break;
    default:
      throw new Error("unknown data type");
  }

  async function nodeBlobReadAsArrayBuffer(
    blob: NodeBlob
  ): Promise<ArrayBuffer> {
    return blob.arrayBuffer();
  }

  async function blobReadAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    const reader = new FileReader();

    reader.readAsArrayBuffer(blob);

    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.onabort = () => reject(new Error("file read aborted"));
    });
  }
}
