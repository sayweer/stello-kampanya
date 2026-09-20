import type { NextConfig } from "next";

const config: NextConfig = {
  // @stello/core is consumed as TypeScript source, not a built package.
  transpilePackages: ["@stello/core"],
};

export default config;
