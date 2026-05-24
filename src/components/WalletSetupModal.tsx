import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, Loader2, CheckCircle2, AlertCircle, Smartphone, ExternalLink } from "lucide-react";
import { useMobileWallet } from "@/hooks/useMobileWallet";

interface WalletSetupModalProps {
  onComplete: () => void;
}

const WalletSetupModal = ({ onComplete }: WalletSetupModalProps) => {
  const { user } = useAuth();
  const { isMobile, isFreighterReady, connect } = useMobileWallet();

  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<"freighter" | "albedo" | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    // On desktop without Freighter, guide user before attempting
    if (!isMobile && !isFreighterReady) {
      setError("Freighter no está instalado. Instálalo desde freighter.app o usa Albedo.");
      setConnecting(false);
      return;
    }

    const result = await connect();

    if (!result.ok) {
      setError(
        result.cancelled
          ? "Conexión cancelada. Puedes intentarlo de nuevo."
          : result.error
      );
      setConnecting(false);
      return;
    }

    setAddress(result.address);
    setWalletProvider(result.provider);
    setConnecting(false);
  };

  const handleSave = async () => {
    if (!address || !user) return;
    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ wallet_address: address })
      .eq("user_id", user.id);

    if (dbError) {
      setError("No se pudo guardar. Intenta de nuevo.");
      setSaving(false);
      return;
    }

    // Persist provider choice for future signing
    if (walletProvider) {
      localStorage.setItem("vinculo_wallet_provider", walletProvider);
    }
    localStorage.setItem("vinculo_wallet", address);

    setDone(true);
    setTimeout(onComplete, 1200);
  };

  const truncate = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;

  const providerLabel = isMobile ? "Albedo" : isFreighterReady ? "Freighter" : "Albedo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-6">
      <div
        className="w-full max-w-sm bg-card rounded-2xl shadow-xl p-6 space-y-5 animate-fade-up"
        style={{ animationDuration: "400ms" }}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="w-12 h-12 text-primary" />
            <p className="text-lg font-bold text-foreground">¡Wallet conectada!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {isMobile ? <Smartphone className="w-5 h-5 text-primary" /> : <Wallet className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">Conecta tu wallet</h2>
                <p className="text-xs text-muted-foreground">
                  {isMobile ? "Vía Albedo (web wallet)" : `Vía ${providerLabel}`}
                </p>
              </div>
            </div>

            {address ? (
              <div className="bg-secondary rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">Dirección Stellar</p>
                <p className="text-sm font-mono font-medium text-foreground">{truncate(address)}</p>
                {walletProvider && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                    via {walletProvider}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full rounded-xl border-2 border-dashed border-border bg-secondary/50 py-6 flex flex-col items-center gap-2 hover:bg-secondary transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <Wallet className="w-6 h-6 text-primary" />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {connecting ? "Conectando..." : `Conectar con ${providerLabel}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isMobile
                    ? "Se abrirá Albedo en tu navegador"
                    : isFreighterReady
                    ? "Se abrirá la extensión Freighter"
                    : "Se abrirá Albedo (no requiere extensión)"}
                </span>
              </button>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-destructive/10 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onComplete}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors active:scale-[0.97]"
              >
                Después
              </button>
              {address && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Guardar"}
                </button>
              )}
            </div>

            {!isMobile && (
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                ¿No tienes Freighter? Descárgala aquí
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WalletSetupModal;
