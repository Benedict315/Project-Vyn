import { useState } from "react";
import { Plus, LogOut, User, AlertTriangle } from "lucide-react";
import logoVin from "@/assets/logo-vin.png";
import BalanceCard from "@/components/BalanceCard";
import ProgressRing from "@/components/ProgressRing";
import CreditSection from "@/components/CreditSection";
import ActivityList from "@/components/ActivityList";
import DepositModal from "@/components/DepositModal";
import BottomNav from "@/components/BottomNav";
import { useWallet } from "@/hooks/useWallet";

const Index = () => {
  const { shortWallet, disconnect, walletStatus } = useWallet();
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoVin} alt="Vyn" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Vyn</h1>
            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
              <User className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-mono font-bold tracking-wider uppercase">
                {shortWallet || "Cargando..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={disconnect}
            className="flex items-center justify-center p-2 text-muted-foreground hover:text-destructive bg-secondary/50 rounded-full transition-colors active:scale-95 border border-transparent hover:border-destructive/20"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Disconnected wallet banner */}
      {walletStatus === "disconnected" && (
        <div className="mx-5 mb-2 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-700">Wallet desconectada</p>
            <p className="text-[11px] text-amber-800/70">
              Freighter no está disponible. Reconecta tu wallet para operar.
            </p>
          </div>
          <button
            onClick={disconnect}
            className="text-[11px] font-bold text-amber-700 hover:underline flex-shrink-0"
          >
            Reconectar
          </button>
        </div>
      )}

      {/* Content Main */}
      <main className="px-5 space-y-4 max-w-md mx-auto mt-2">
        <section className="space-y-4 opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          
          <BalanceCard />
          
          <button
            onClick={() => setDepositOpen(true)}
            className="btn-emerald w-full flex items-center justify-center gap-2 py-4 text-base font-bold shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-5 h-5" />
            Depositar Ganancias
          </button>

          {/* Rueda matemática conectada a Node.js */}
          <ProgressRing />

        </section>

        {/* Sección de Crédito (Usa la reputación calculada) */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "250ms", animationFillMode: "forwards" }}>
          <CreditSection />
        </section>

        {/* Historial de transacciones */}
        <section className="opacity-0 animate-fade-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
          <ActivityList />
        </section>
      </main>

      {/* Navegación inferior persistente */}
      <BottomNav />
      
      {/* Modal de depósitos */}
      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  );
};

export default Index;