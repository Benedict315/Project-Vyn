import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";

interface WalletSetupModalProps {
  onComplete: () => void;
}

const WALLET_REGEX = /^[A-Za-z0-9]{20,256}$/;

const WalletSetupModal = ({ onComplete }: WalletSetupModalProps) => {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Ingresa tu dirección de wallet.");
      return;
    }
    if (!WALLET_REGEX.test(trimmed)) {
      setError("Dirección inválida. Solo letras y números, 20-256 caracteres.");
      return;
    }
    if (!user) return;

    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ wallet_address: trimmed })
      .eq("user_id", user.id);

    if (dbError) {
      setError("No se pudo guardar. Intenta de nuevo.");
      setSaving(false);
      return;
    }

    setDone(true);
    setTimeout(onComplete, 1200);
  };

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
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">Conecta tu wallet</h2>
                <p className="text-xs text-muted-foreground">Ingresa tu dirección cripto</p>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Ej: GBXK…7WQR o 0x1a2b…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={256}
                autoFocus
              />
              {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onComplete}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors active:scale-[0.97]"
              >
                Después
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletSetupModal;
