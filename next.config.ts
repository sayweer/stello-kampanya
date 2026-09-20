import type { NextConfig } from "next";

const config: NextConfig = {
  /**
   * Both languages are real pages so a link opens in the language it was read
   * in. The bare domain goes to Turkish, which is what the room speaks.
   */
  async redirects() {
    return [{ source: "/", destination: "/tr", permanent: false }];
  },
};

export default config;
