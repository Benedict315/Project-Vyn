/**
 * useMobileWallet
 *
 * Thin React hook that wraps the connector abstraction and exposes:
 *  - connect()        → get public key (auto-picks provider)
 *  - sign(xdr)        → sign a transaction XDR
 *  - isMobile         → boolean
 *  - provider         → "freighter" | "albedo"
 *  - isFreighterReady → boolean (extension detected)
 */

import { useState, useEffect } from "react";
import {
  connectWallet,
  signTransactionXdr,
  isMobileBrowser,
  isFreighterAvailable,
  getSavedProvider,
  saveProvider,
  type ConnectResult,
  type SignResult,
} from "@/lib/mobileWalletConnectors";

export function useMobileWallet() {
  const [isMobile] = useState<boolean>(() => isMobileBrowser());
  const [freighterReady, setFreighterReady] = useState<boolean>(false);
  const [provider, setProvider] = useState<"freighter" | "albedo">(
    getSavedProvider
  );

  // Poll for Freighter extension on desktop (it may inject after page load)
  useEffect(() => {
    if (isMobile) return;

    const check = () => {
      const available = isFreighterAvailable();
      setFreighterReady(available);
      // If extension just appeared and user hasn't explicitly chosen albedo, switch
      if (available && getSavedProvider() !== "albedo") {
        setProvider("freighter");
      }
    };

    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [isMobile]);

  const connect = async (): Promise<ConnectResult> => {
    const result = await connectWallet();
    if (result.ok) {
      saveProvider(result.provider);
      setProvider(result.provider);
    }
    return result;
  };

  const sign = async (xdr: string): Promise<SignResult> => {
    return signTransactionXdr(xdr, provider);
  };

  return {
    isMobile,
    provider,
    isFreighterReady: freighterReady,
    connect,
    sign,
  };
}
