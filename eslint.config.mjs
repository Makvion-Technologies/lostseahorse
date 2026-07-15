import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  /**
   * React Three Fiber / Three.js scenes mutate materials, cameras, and geometry
   * buffers inside useFrame. That is the standard R3F model and conflicts with
   * React Compiler purity rules intended for pure React UI trees.
   */
  {
    files: [
      "src/components/gameplay/three/**/*.{ts,tsx}",
      "src/components/three/**/*.{ts,tsx}",
      "src/game/systems/**/*.{ts,tsx}",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
