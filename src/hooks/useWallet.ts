import { useState, useEffect } from "react";
import { walletAdapter } from "@/wallet";

export const useWallet = () => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const address = walletAdapter.getAddress();
    setWallet(address);
    setLoading(false);
  }, []);

  const setWalletAddress = (address: string) => {
    localStorage.setItem("vinculo_wallet", address);
    setWallet(address);
  };

  const shortWallet = wallet
    ? `${wallet.substring(0, 5)}...${wallet.substring(wallet.length - 4)}`
    : "";

  const disconnect = () => walletAdapter.disconnect();

  return { wallet, loading, setWalletAddress, shortWallet, disconnect };
};
