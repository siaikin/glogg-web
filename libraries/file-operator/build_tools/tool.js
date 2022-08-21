import del from "del";
import { parse, basename } from "path";
import { spawn } from "child_process";

export function deletee(path) {
  function func() {
    return del(path);
  }
  func.displayName = `del[${path}]`;

  return func;
}

export function bundleSingle(entry, file, name, format = "umd") {
  function func(cb) {
    const cl = spawn(
      /^win/.test(process.platform) ? "rollup.cmd" : "rollup",
      [
        "--config",
        "rollup.config.js",
        "--format",
        format,
        "--input",
        entry,
        "--file",
        file,
        "--name",
        name,
      ],
      {
        stdio: "inherit",
      }
    );
    cl.on("close", (code) => {
      if (code !== 0) {
        throw new Error(`bundle single file[${file}] failed`);
      } else {
        cb();
      }
    });
  }
  func.displayName = `bundle single file[${file}]`;

  return func;
}

export function bundleSingleMultFormat(
  entry,
  file,
  globalName,
  formatList = ["umd"]
) {
  const result = [];

  for (let i = 0; i < formatList.length; i++) {
    const pathInfo = parse(file);
    const name = basename(file, ".js");
    const format = formatList[i];
    let fileExtension;

    switch (format) {
      case "cjs":
      case "commonjs":
        fileExtension = "cjs";
        break;
      case "es":
        fileExtension = "mjs";
        break;
      default:
        fileExtension = "js";
    }

    result.push(
      bundleSingle(
        entry,
        `${pathInfo.dir}/${name}.${fileExtension}`,
        globalName,
        format
      )
    );
  }

  return result;
}

export function buildTypeScript(tsconfigPath) {
  function func(cb) {
    const cl = spawn(
      /^win/.test(process.platform) ? "tsc.cmd" : "tsc",
      ["--build", tsconfigPath],
      { stdio: "inherit" }
    );
    cl.on("close", (code) => {
      if (code !== 0) {
        throw new Error(`generate types[${tsconfigPath}] failed`);
      } else {
        cb();
      }
    });
  }
  func.displayName = `generate types[${tsconfigPath}]`;

  return func;
}

export function testPlatform() {
  function func(cb) {
    const cl = spawn(
      /^win/.test(process.platform) ? "jest.cmd" : "jest",
      [
        "--config",
        "jest.config.js",
        // '--silent',
        "--detectOpenHandles",
        // "--testNamePattern='should search all line separator when instance created'",
      ],
      {
        stdio: "inherit",
      }
    );
    cl.on("close", (code) => {
      if (code !== 0) {
        throw new Error("test platform failed");
      } else {
        cb();
      }
    });
  }
  func.displayName = "test platform";

  return func;
}

// module.exports = {
//   deletee,
//   bundleSingle,
//   buildTypeScript,
//   testPlatform
// }
