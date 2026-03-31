import { useState, useEffect } from 'react';

export const useWallet = () => {
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    // Leer la wallet guardada durante el login
    const savedWallet = localStorage.getItem('vinculo_wallet');
    if (savedWallet) {
      setWallet(savedWallet);
    }
  }, []);

  // Función para formatear la llave (ej: GDAH...J5W) para que se vea bonita
  const shortWallet = wallet 
    ? `${wallet.substring(0, 5)}...${wallet.substring(wallet.length - 4)}` 
    : '';

  // Función para cerrar sesión
  const disconnect = () => {
    localStorage.removeItem('vinculo_wallet');
    localStorage.removeItem('vinculo_onboarded');
    window.location.href = '/login';
  };

  return { wallet, shortWallet, disconnect };
};