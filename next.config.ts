import type { NextConfig } from "next";

const config: NextConfig = {
  // stello-sdk is consumed as TypeScript source, not a built package.
  transpilePackages: ["stello-sdk"],
};

export default config;
