import { useState } from "react";
import { Plus, FastForward, LogOut, User } from "lucide-react";
import logoVin from "@/assets/logo-vin.png";
import BalanceCard from "@/components/BalanceCard";
import ProgressRing from "@/components/ProgressRing";
import CreditSection from "@/components/CreditSection";
import ActivityList from "@/components/ActivityList";
import DepositModal from "@/components/DepositModal";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppContext";
import { useWallet } from "@/hooks/useWallet"; // <-- Tu hook de sesión Web3

const Index = () => {
  // 1. Traemos la función para simular el tiempo del contexto
  
  
  // 2. Traemos la info de la wallet y la función de desconexión
  const { shortWallet, disconnect } = useWallet();
  
  // 3. Estado para controlar el modal de depósitos
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Adaptado a Web3 */}
      <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoVin} alt="Vyn" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Vyn</h1>
            {/* Visualización de la Wallet conectada */}
            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
              <User className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] font-mono font-bold tracking-wider uppercase">
                {shortWallet || "Cargando..."}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">

          {/* Botón para Cerrar Sesión y limpiar LocalStorage */}
          <button
            onClick={disconnect}
            className="flex items-center justify-center p-2 text-muted-foreground hover:text-destructive bg-secondary/50 rounded-full transition-colors active:scale-95 border border-transparent hover:border-destructive/20"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

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