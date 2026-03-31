import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { ArrowUpRight, ArrowDownLeft, PiggyBank, Loader2, ExternalLink } from "lucide-react";

// Definimos la estructura de nuestro movimiento
interface Movement {
  id: string;
  type: "deposit" | "withdrawal";
  label: string;
  amount: string;
  date: Date;
}

const ActivityList = () => {
  const { wallet: walletAddress } = useWallet();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        // Consultamos los "Efectos" en la cuenta, no las operaciones. 
        // Esto nos da los montos exactos de XLM que entraron o salieron.
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}/effects?limit=50&order=desc`);
        
        if (!res.ok) throw new Error("Error leyendo Horizon");
        
        const data = await res.json();

        const parsedMovements: Movement[] = data._embedded.records
          .filter((effect: any) => 
            // Filtramos solo entradas y salidas de dinero
            (effect.type === "account_debited" || effect.type === "account_credited") &&
            // Ignoramos las comisiones de red (gas) que suelen ser menores a 0.05 XLM
            parseFloat(effect.amount) > 0.05 
          )
          .map((effect: any) => {
            // Si la cuenta fue debitada, el dinero fue al contrato (Ahorro/Depósito)
            const isDeposit = effect.type === "account_debited";

            return {
              id: effect.id,
              type: isDeposit ? "deposit" : "withdrawal",
              label: isDeposit ? "Depósito a Vínculo" : "Retiro de Crédito",
              amount: parseFloat(effect.amount).toFixed(2),
              date: new Date(effect.created_at),
            };
          });

        // Guardamos solo los últimos 10 movimientos como pediste
        setMovements(parsedMovements.slice(0, 5));

      } catch (error) {
        console.error("Error cargando historial de actividad:", error);
      } finally {
        setLoading(false);
      }
    };

    // 1. Carga inicial
    fetchHistory();

    // 2. Polling: Actualizamos silenciosamente cada 10 segundos
    // Así, si el usuario deposita, la lista se actualiza sola sin recargar la página.
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);

  }, [walletAddress]);

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="card-elevated p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  // Estado vacío: Sin wallet o sin historial
  if (movements.length === 0) {
    return (
      <div className="card-elevated p-8 flex flex-col items-center text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
          <PiggyBank className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground mb-0.5">
          {walletAddress ? "Sin actividad aún" : "Wallet no conectada"}
        </p>
        <p className="text-xs text-muted-foreground">
          {walletAddress ? "Realiza tu primer depósito para comenzar" : "Conecta Freighter para ver tu historial"}
        </p>
      </div>
    );
  }

  // Lista de Movimientos Reales
  return (
    <div className="card-elevated divide-y divide-border">
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Actividad Reciente</span>
        <span className="text-[10px] font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          Stellar Testnet
        </span>
      </div>
      
      {movements.map((d, i) => (
        <div
          key={d.id}
          className="flex items-center gap-3 px-5 py-3.5 opacity-0 animate-fade-up hover:bg-secondary/30 transition-colors"
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
        >
          {/* Icono Dinámico */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            d.type === "deposit" ? "bg-primary/10" : "bg-emerald-500/10"
          }`}>
            {d.type === "deposit" ? (
              <ArrowUpRight className="w-4 h-4 text-primary" />
            ) : (
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          
          {/* Info del Movimiento */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{d.label}</p>
            <p className="text-xs text-muted-foreground">
              {d.date.toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          
          {/* Monto Dinámico */}
          <div className="text-right">
            <span className={`text-sm font-bold tabular-nums ${
              d.type === "deposit" ? "text-primary" : "text-emerald-500"
            }`}>
              {d.type === "deposit" ? "+" : "-"}{d.amount} XLM
            </span>
            <a 
              href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
              target="_blank"
              rel="noreferrer"
              className="block text-[9px] font-medium text-muted-foreground mt-0.5 hover:text-foreground transition-colors flex items-center justify-end gap-0.5"
            >
              Ver en red <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList;