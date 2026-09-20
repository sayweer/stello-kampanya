import type { NextConfig } from "next";

const config: NextConfig = {
  /**
   * Both languages are real pages so a link opens in the language it was read
   * in. The bare domain goes to English, to match the developer site this app
   * is an example for; Turkish is one click away in the header.
   */
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
};

export default config;
