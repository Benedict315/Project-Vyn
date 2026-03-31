import { useState, useEffect } from "react";

export const useWallet = () => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Leer wallet del localStorage
    const savedWallet = localStorage.getItem("vinculo_wallet");
    setWallet(savedWallet);
    setLoading(false);
  }, []);

  const setWalletAddress = (address: string) => {
    localStorage.setItem("vinculo_wallet", address);
    setWallet(address);
  };

  return { wallet, loading, setWalletAddress };
};
