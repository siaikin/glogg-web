import gulp from "gulp";
import {
  testPlatform,
  buildTypeScript,
  deletee,
  bundleSingleMultFormat,
} from "./build_tools/tool.js";

const { series } = gulp;

function buildDefaultTask(clear = true) {
  return series(
    [
      clear ? deletee("dist") : "",
      buildTransformToJSLibTask(),
      buildBundleWorkerScriptTask(),
      ...bundleSingleMultFormat(
        "dist/esm/index.js",
        "dist/esm/bundle/index.js",
        "BLOB_READER_FACTORY",
        ["umd", "es"]
      ),
    ].filter((item) => item)
  );
}

function buildTestTask() {
  return series([buildDefaultTask(), testPlatform()].filter((item) => item));
}

function buildTransformToJSLibTask(clear = false) {
  return series(
    [clear ? deletee("dist") : "", buildTypeScript("tsconfig.json")].filter(
      (item) => item
    )
  );
}

function buildBundleWorkerScriptTask(clear = false) {
  return series(
    [
      clear ? deletee("dist") : "",
      ...bundleSingleMultFormat(
        "dist/esm/worker/tool-worker/ToolWorkerScript.js",
        "dist/esm/worker/bundle/toolWorkerScript.js",
        "TOOL_WORKER_SCRIPT",
        ["umd", "cjs"]
      ),
      ...bundleSingleMultFormat(
        "dist/esm/worker/tool-worker/ToolWorker.js",
        "dist/esm/worker/bundle/toolWorker.js",
        "TOOL_WORKER",
        ["umd", "cjs"]
      ),
    ].filter((item) => item)
  );
}

export default buildDefaultTask();
export const test = buildTestTask();

// module.exports = {
//   default: buildDefaultTask(),
//   test: buildTestTask(),
//   transformLib: buildTransformToJSLibTask(),
//   bundleWorker: buildBundleWorkerScriptTask(),
// }
