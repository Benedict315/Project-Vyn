export type { WalletAdapter } from "./WalletAdapter";
export { FreighterAdapter } from "./FreighterAdapter";

import { FreighterAdapter } from "./FreighterAdapter";

/** Singleton adapter used throughout the app. */
export const walletAdapter = new FreighterAdapter();
