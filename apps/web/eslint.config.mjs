import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    files: ["app/**/page.tsx", "app/**/page.jsx"],
    rules: {
      // These async Server Components catch remote API availability failures and
      // return an explicit unavailable state. They are not used as render error boundaries.
      "react-hooks/error-boundaries": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
