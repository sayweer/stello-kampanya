import deployment from "../../deployments/testnet.json";

/** This app's own deployment: its contract, and the route it registered on Stello's router. */
export const campaignConfig = {
  campaignId: deployment.campaignId,
  routeId: deployment.routeId,
  /** Stello's hosted relay; nudged so a pledge lands without waiting for its next pass. */
  relayUrl: process.env.NEXT_PUBLIC_STELLO_RELAY_URL,
} as const;
