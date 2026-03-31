import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useWallet } from "@/hooks/useWallet";
import { fetchContractBalance } from "../stellar/queries"; 
import { Shield, Wallet, Star, ChevronRight, LogOut, HelpCircle, Bell, Loader2, Award, Lock, Activity } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import WalletSetupModal from "@/components/WalletSetupModal";
import NFTModal from "@/components/NFTModal";
import logoVin from "@/assets/logo-vin.png";

const Perfil = () => {
  const navigate = useNavigate();

  const { creditWithdrawn } = useApp();
  const { wallet: walletAddress, shortWallet, disconnect } = useWallet();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const [isMinting, setIsMinting] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [nftTxHash, setNftTxHash] = useState<string | undefined>();

  // --- ESTADOS ON-CHAIN ACTUALIZADOS ---
  const [onChainXLM, setOnChainXLM] = useState<number | string>(0);
  const [availableCredit, setAvailableCredit] = useState(0); // <-- Nueva métrica real
  const [nftTier, setNftTier] = useState("Bronce");
  
  const [riskData, setRiskData] = useState({ 
    score: 0, 
    tier: 0, 
  });

  const displayName = walletAddress ? shortWallet : "Conecta tu wallet";
  const initials = walletAddress ? walletAddress.slice(0, 2).toUpperCase() : "WL";

  // 1. LECTURA HÍBRIDA (Balance Directo + API de Crédito/Tier)
  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (!walletAddress) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);

        // --- A. OBTENER SALDO DIRECTO (Tu función Queries) ---
        const balance = await fetchContractBalance(walletAddress);
        setOnChainXLM(balance);
        
        // --- B. OBTENER TIER Y LÍMITE DE CRÉDITO (Tu API de Vercel) ---
        try {
          const tierResponse = await fetch(`/api/get-available-credit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userAddress: walletAddress })
          });

          if (tierResponse.ok) {
            const tierData = await tierResponse.json();
            if (tierData.success) {
              setNftTier(tierData.tierName);
              setAvailableCredit(tierData.availableCredit); // <-- Dato real de tu lógica
              setRiskData(prev => ({ ...prev, tier: tierData.tier }));
            }
          }
        } catch (apiError) {
          console.warn("Error consultando Tier API:", apiError);
        }

      } catch (error) {
        console.error("Error general leyendo blockchain:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchBlockchainData();
  }, [walletAddress]);

  // 2. MOTOR DE RIESGO (Score basado en balance real)
  useEffect(() => {
    const fetchRiskScore = async () => {
      if (Number(onChainXLM) <= 0 || !walletAddress) return;
      try {
        const response = await fetch(`/api/calculate-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            address: walletAddress, 
            totalDeposited: Number(onChainXLM),
            depositCount: Number(onChainXLM) > 0 ? 1 : 0 // Fallback mínimo
          }) 
        });
        const data = await response.json();
        if (data.score !== undefined) {
          setRiskData(prev => ({ ...prev, score: data.score }));
        }
      } catch (error) {
        console.error("Error sincronizando matemáticas:", error);
      }
    };
    
    if (!loadingProfile) fetchRiskScore();
  }, [onChainXLM, walletAddress, loadingProfile]);

  // Lógica de visualización de progreso
  let nextThreshold = 50; 
  if (riskData.score >= 50) nextThreshold = 150;
  if (riskData.score >= 150) nextThreshold = 500;
  if (riskData.score >= 500) nextThreshold = 1000;
  if (riskData.score >= 1000) nextThreshold = riskData.score;

  const visualPercentage = Math.min(100, Math.floor((riskData.score / nextThreshold) * 100));
  const isUnlocked = riskData.tier >= 1; 

  const handleClaimNFT = async () => {
    if (!walletAddress) return;
    setIsMinting(true);
    try {
      const response = await fetch(`/api/evaluate-and-mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userAddress: walletAddress, 
          totalVolume: Number(onChainXLM)
        })
      });
      const data = await response.json();
      if (response.ok && data.status === "minted") {
        setNftTxHash(data.txHash);
        setShowNFTModal(true);
      } else {
        alert(data.message || "Error al procesar el NFT");
      }
    } catch (error) {
      console.error("Error minteando:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const handleLogout = () => disconnect();

  const menuItems = [
    { icon: Bell, label: "Notificaciones", detail: "Activadas", action: () => navigate("/notificaciones") },
    { icon: HelpCircle, label: "Centro de ayuda", detail: "", action: () => navigate("/ayuda") },
    { icon: LogOut, label: "Cerrar sesión", detail: "", destructive: true, action: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 font-nunito">
      <header className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2 flex items-center gap-3">
        <img src={logoVin} alt="Vin" className="w-7 h-7 object-contain" />
        <h1 className="text-xl font-bold text-foreground tracking-tight">Perfil</h1>
      </header>

      <main className="px-5 max-w-md mx-auto space-y-4">
        {/* Card de Identidad */}
        <div className="card-elevated p-6 flex items-center gap-4 animate-fade-up">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-xl font-bold text-primary-foreground font-mono">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground truncate font-mono">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Wallet conectada
            </p>
          </div>
        </div>

        {/* STATS RÁPIDAS (Ahora con Crédito) */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="card-elevated p-4 text-center">
            <Wallet className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-lg font-bold text-foreground tabular-nums">
              {loadingProfile ? "..." : onChainXLM}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">XLM Ahorro</p>
          </div>
          
          <div className="card-elevated p-4 text-center border-emerald-500/20 bg-emerald-500/5">
            <Star className="w-4 h-4 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-emerald-700 tabular-nums">
              {loadingProfile ? "..." : availableCredit}
            </p>
            <p className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider">Crédito XLM</p>
          </div>

          <div className="card-elevated p-4 text-center bg-primary/5 border border-primary/20">
            <Shield className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-lg font-bold text-primary">{loadingProfile ? "..." : nftTier}</p>
            <p className="text-[10px] text-primary/80 font-semibold uppercase tracking-wider">Nivel NFT</p>
          </div>
        </div>

        {/* Card de Reputación */}
        <div className={`card-elevated p-5 border-2 animate-fade-up ${isUnlocked ? "border-primary/30 bg-primary/5" : "border-transparent"}`} style={{ animationDelay: "200ms" }}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${isUnlocked ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Reputación Vínculo</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
              <Activity className="w-3 h-3" />
              <span className="font-bold">{riskData.score.toFixed(1)} pts</span>
            </div>
          </div>
          
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mb-2 relative">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isUnlocked ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-muted-foreground/40"}`}
              style={{ width: `${visualPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
            {isUnlocked ? (
              <span className="text-primary font-bold tracking-wide">✓ LÍMITE AUMENTADO</span>
            ) : (
              <span className="flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3" /> Requiere Nivel Plata
              </span>
            )}
            <span className="font-bold">{visualPercentage}% al sig. nivel</span>
          </div>

          {nftTier !== "Diamante" ? (
            <button
              onClick={handleClaimNFT}
              disabled={isMinting || !walletAddress || Number(onChainXLM) === 0}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3.5 text-sm font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {isMinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
              {isMinting ? "Firmando en Soroban..." : "Evaluar y Subir de Nivel (NFT)"}
            </button>
          ) : (
              <div className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 py-3 px-3 text-xs font-bold text-blue-700 text-center uppercase tracking-wider">
                Nivel Máximo Alcanzado 💎
              </div>
          )}
        </div>
        
        {/* Wallet Address Display */}
        <div className="card-elevated p-5 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Dirección Stellar</span>
          </div>
          {loadingProfile ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
              <p className="text-sm font-mono font-medium text-foreground break-all">{walletAddress}</p>
            </div>
          )}
        </div>

        {/* Menú */}
        <div className="card-elevated divide-y divide-border animate-fade-up overflow-hidden" style={{ animationDelay: "400ms" }}>
          {menuItems.map(({ icon: Icon, label, detail, destructive, action }) => (
            <button key={label} onClick={action} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors group">
              <Icon className={`w-5 h-5 ${destructive ? "text-destructive" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className={`flex-1 text-left text-sm font-semibold ${destructive ? "text-destructive" : "text-foreground"}`}>{label}</span>
              {detail && <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{detail}</span>}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest pt-2 pb-6">Vyn v1.0 · Stellar Network</p>
      </main>

      <NFTModal
        open={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        walletAddress={walletAddress || ""}
        level={nftTier}
        depositsCount={Number(onChainXLM) > 0 ? 1 : 0}
        totalVolume={Number(onChainXLM)}
        txHash={nftTxHash}
      />

      <BottomNav />
    </div>
  );
};

export default Perfil;