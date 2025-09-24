import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // Performance optimizations for faster linting
    rules: {
      // Disable some expensive rules for faster verification
      "@typescript-eslint/explicit-function-return-type": "off", // Can be slow
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Less strict
    },
  },
];

export default eslintConfig;
