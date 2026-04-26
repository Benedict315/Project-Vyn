import { useState, useEffect } from "react";
import { isFreighterAvailable, isMobileBrowser } from "@/lib/mobileWalletConnectors";

export type WalletStatus = "loading" | "connected" | "disconnected" | "missing";

export const useWallet = () => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("loading");

  useEffect(() => {
    const savedWallet = localStorage.getItem("vinculo_wallet");
    setWallet(savedWallet);

    if (!savedWallet) {
      setWalletStatus("missing");
    } else {
      // On desktop, check if the extension that was used is still available
      const savedProvider = localStorage.getItem("vinculo_wallet_provider");
      const onDesktop = !isMobileBrowser();
      if (onDesktop && savedProvider === "freighter" && !isFreighterAvailable()) {
        // Wallet address is saved but Freighter is gone (removed/locked)
        setWalletStatus("disconnected");
      } else {
        setWalletStatus("connected");
      }
    }

    setLoading(false);
  }, []);

  const setWalletAddress = (address: string) => {
    localStorage.setItem("vinculo_wallet", address);
    setWallet(address);
    setWalletStatus("connected");
  };

  // Short display format: GDAH5...J5W
  const shortWallet = wallet
    ? `${wallet.substring(0, 5)}...${wallet.substring(wallet.length - 4)}`
    : "";

  const disconnect = () => {
    localStorage.removeItem("vinculo_wallet");
    localStorage.removeItem("vinculo_onboarded");
    localStorage.removeItem("vinculo_wallet_provider");
    window.location.href = "/login";
  };

  return { wallet, loading, walletStatus, shortWallet, disconnect, setWalletAddress };
};
