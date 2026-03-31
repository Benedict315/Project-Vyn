/// <reference types="vite/client" />

interface Window {
  freighter?: {
    getPublicKey(): Promise<string>;
    signTransaction(transaction: string): Promise<string>;
    isConnected(): Promise<boolean>;
  };
}
