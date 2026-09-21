import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /**
   * The wall around the maths.
   *
   * `src/engine` is pure arithmetic. It may not import React, Next, or
   * anything from the screen layers. Two reasons:
   *
   *   1. The maths can then be tested in Jest's plain node environment, with
   *      no pretend browser in the way.
   *   2. Block 9 renders a quote on the server. The engine has to be
   *      reusable there without dragging a screen along.
   *
   * A test (B0-T3) runs ESLint over a file that breaks this rule and expects
   * exactly one error, so the wall itself is proven, not just declared.
   */
  {
    files: ["src/engine/**/*.ts", "src/engine/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "next",
                "next/*",
                "server-only",
                "client-only",
                "@/app",
                "@/app/*",
                "@/ui",
                "@/ui/*",
                "@/store",
                "@/store/*",
              ],
              message:
                "src/engine is pure maths: no React, no Next, no screens. It must run in Jest's node environment and on the server.",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ours:
    "coverage/**",
  ]),
]);

export default eslintConfig;
