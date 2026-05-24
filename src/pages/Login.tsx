import { useState, useEffect } from "react";
import { Loader2, Wallet, AlertCircle, ExternalLink } from "lucide-react";
import logoVin from "@/assets/logo-vin.png";
import { walletAdapter } from "@/wallet";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado único: ¿La extensión de Chrome/Brave/Edge está lista?
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

  useEffect(() => {
    const checkExtension = async () => {
      try {
        if (await walletAdapter.isConnected()) {
          setIsExtensionInstalled(true);
        }
      } catch (e) {
        // Ignoramos errores silenciosamente durante la detección
      }
    };

    checkExtension();
    
    // Polling ligero de 1 segundo por si la extensión tarda en inyectarse al recargar la página
    const interval = setInterval(checkExtension, 1000);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const address = await walletAdapter.connect();
      localStorage.setItem("vinculo_onboarded", "1");
      setTimeout(() => { window.location.href = "/"; }, 200);
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || "";
      if (msg.includes("User declined") || msg.includes("User rejected")) {
        setError("Conexión rechazada. Debes aprobar la solicitud en Freighter.");
      } else {
        setError("Error de conexión. Verifica que tu extensión esté desbloqueada.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center animate-in fade-in zoom-in duration-500">
        <img src={logoVin} alt="Vyn" className="w-20 h-20 object-contain mx-auto mb-4" />
        <h1 className="text-2xl font-black text-foreground tracking-tight italic">Vínculo</h1>
        <p className="text-muted-foreground text-sm mt-1">Stellar Microcredits</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        
        {isExtensionInstalled ? (
          /* ESTADO A: Extensión Detectada -> Botón de Conectar */
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary text-primary-foreground px-5 py-4 text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
            {loading ? "Conectando..." : "Conectar Wallet"}
          </button>
        ) : (
          /* ESTADO B: No hay Extensión -> Call to action para descargarla */
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-sm font-bold text-amber-700 mb-1">Freighter no detectado</p>
              <p className="text-xs text-amber-800/80">
                Para usar Vínculo, necesitas la extensión de billetera de Stellar.
              </p>
            </div>
            
            <a 
              href="https://www.freighter.app/" 
              target="_blank" 
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary text-foreground px-5 py-4 text-sm font-bold active:scale-[0.98] transition-all hover:bg-secondary/80"
            >
              <ExternalLink className="w-4 h-4" />
              Instalar Freighter
            </a>
          </div>
        )}

        {/* Notificación de Error */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold uppercase text-center animate-shake mt-4">
            <AlertCircle className="w-4 h-4 inline mr-2 mb-0.5" />
            {error}
          </div>
        )}
      </div>

      <p className="mt-12 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-30">
        Stellar Protocol · 2026
      </p>
    </div>
  );
};

export default Login;