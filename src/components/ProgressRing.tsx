import { useApp } from "@/context/AppContext";
import { Shield, Star, Crown, Gem, Trophy } from "lucide-react";

interface Level {
  name: string;
  emoji: string;
  icon: React.ElementType;
  minDeposits: number;
  color: string; // HSL CSS var
  creditAmount: number;
}

const LEVELS: Level[] = [
  { name: "Bronce", emoji: "🥉", icon: Shield, minDeposits: 0, color: "var(--sky)", creditAmount: 0 },
  { name: "Plata", emoji: "🥈", icon: Star, minDeposits: 3, color: "var(--sky)", creditAmount: 300 },
  { name: "Oro", emoji: "🥇", icon: Crown, minDeposits: 7, color: "var(--deep)", creditAmount: 600 },
  { name: "Diamante", emoji: "💎", icon: Gem, minDeposits: 12, color: "var(--grape)", creditAmount: 1000 },
  { name: "Élite", emoji: "🏆", icon: Trophy, minDeposits: 20, color: "var(--grape)", creditAmount: 2000 },
];

export function getCurrentLevel(depositsCount: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (depositsCount >= level.minDeposits) current = level;
  }
  return current;
}

export function getNextLevel(depositsCount: number): Level | null {
  for (const level of LEVELS) {
    if (depositsCount < level.minDeposits) return level;
  }
  return null;
}

const ProgressRing = () => {
  const { depositsCount } = useApp();
  const current = getCurrentLevel(depositsCount);
  const next = getNextLevel(depositsCount);

  const progress = next
    ? Math.min((depositsCount - current.minDeposits) / (next.minDeposits - current.minDeposits), 1)
    : 1;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;
  const Icon = current.icon;

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={`hsl(${current.color})`}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="progress-ring"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-extrabold text-foreground tabular-nums">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground">Reputación</span>
          </div>
          <p className="text-base font-bold text-foreground text-balance">
            {next
              ? `Camino al Nivel ${next.name} ${next.emoji}`
              : `¡Nivel ${current.name} Máximo! ${current.emoji}`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {next
              ? `${depositsCount} de ${next.minDeposits} depósitos realizados`
              : `${depositsCount} depósitos realizados`}
          </p>
          {/* Level badges */}
          <div className="flex gap-1.5 mt-2">
            {LEVELS.map((lvl) => {
              const achieved = depositsCount >= lvl.minDeposits;
              return (
                <span
                  key={lvl.name}
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all ${
                    achieved
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground/50"
                  }`}
                >
                  {lvl.emoji}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressRing;
