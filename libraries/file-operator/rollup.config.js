import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import nodeBuiltins from "rollup-plugin-node-builtins";
import { visualizer } from "rollup-plugin-visualizer";
// import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";

export default {
  output: {
    sourcemap: true,
  },
  context: "this",
  plugins: [
    replace({
      preventAssignment: true,
      __ENV__: JSON.stringify({ NODE_ENV: "production" }),
    }),
    json(),
    sourcemaps(),
    nodeResolve(),
    commonjs(),
    nodeBuiltins(),
    visualizer({ filename: "./dist/stats.html" }),
    // terser(),
  ],
};
