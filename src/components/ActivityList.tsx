import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { ArrowUpRight, ArrowDownLeft, PiggyBank, Loader2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const [effectsRes, opsRes] = await Promise.all([
          fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}/effects?limit=100&order=desc`),
          fetch(`https://horizon-testnet.stellar.org/accounts/${walletAddress}/operations?limit=100&order=desc`)
        ]);

        if (!effectsRes.ok || !opsRes.ok) throw new Error("Error leyendo Horizon");

        const effectsData = await effectsRes.json();
        const opsData = await opsRes.json();

        const debitEffects = (effectsData._embedded.records || [])
          .filter((effect: any) => effect.type === "account_debited")
          .map((effect: any) => ({
            amount: effect.amount !== undefined ? parseFloat(effect.amount) : 0,
            date: effect.created_at ? new Date(effect.created_at) : new Date(),
            used: false,
          }))
          .filter((effect: any) => effect.amount > 0.05);

        const isSorobanInvocation = (type: string) =>
          type === "invoke_host_function" ||
          type === "invoke_contract_function" ||
          type === "invokeContractFunction" ||
          type === "invoke_contract";

        const parsedMovements: Movement[] = (opsData._embedded.records || [])
          .filter((op: any) => isSorobanInvocation(op.type))
          .map((op: any) => {
            const opDate = op.created_at ? new Date(op.created_at) : new Date();
            const matchIndex = debitEffects.findIndex((effect: any) => {
              if (effect.used) return false;
              const diffMs = Math.abs(opDate.getTime() - effect.date.getTime());
              return diffMs <= 5 * 60 * 1000;
            });

            const matched = matchIndex >= 0 ? debitEffects[matchIndex] : null;
            if (matched) matched.used = true;

            const isDeposit = !!matched;

            return {
              id: op.id || op.transaction_hash || matched?.id,
              type: isDeposit ? "deposit" : "withdrawal",
              label: isDeposit ? t("activity.tx_deposit") : t("activity.tx_withdrawal"),
              amount: (matched?.amount || 0).toFixed(2),
              date: matched?.date || opDate,
            };
          })
          .filter((movement: Movement) => Number(movement.amount) > 0.05);

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
          {walletAddress ? t("activity.empty_title_no_activity") : t("activity.empty_title_no_wallet")}
        </p>
        <p className="text-xs text-muted-foreground">
          {walletAddress ? t("activity.empty_description_no_activity") : t("activity.empty_description_no_wallet")}
        </p>
      </div>
    );
  }

  // Lista de Movimientos Reales
  return (
    <div className="card-elevated divide-y divide-border">
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground">{t("activity.header")}</span>
        <span className="text-[10px] font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          {t("common.stellar_testnet")}
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
              {t("common.view_on_network")} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList;