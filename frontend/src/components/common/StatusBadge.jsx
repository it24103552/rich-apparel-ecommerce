import { Clock, CheckCircle2, Truck, PackageCheck, XCircle, CreditCard, ShieldCheck, CircleDot, Star, ThumbsUp, ThumbsDown, Zap } from "lucide-react";

const STATUS_CONFIG = {
  pending:   { icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200/60", dot: "bg-amber-400",   glow: "shadow-amber-100" },
  confirmed: { icon: CheckCircle2,  bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200/60",  dot: "bg-blue-400",    glow: "shadow-blue-100" },
  shipped:   { icon: Truck,         bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200/60",dot: "bg-violet-400",  glow: "shadow-violet-100" },
  delivered: { icon: PackageCheck,   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60",dot:"bg-emerald-400", glow: "shadow-emerald-100" },
  cancelled: { icon: XCircle,       bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200/60",   dot: "bg-red-400",     glow: "shadow-red-100" },
  paid:      { icon: CreditCard,    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60",dot:"bg-emerald-400", glow: "shadow-emerald-100" },
  unpaid:    { icon: Clock,         bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200/60", dot: "bg-amber-400",   glow: "shadow-amber-100" },
  approved:  { icon: ShieldCheck,   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60",dot:"bg-emerald-400", glow: "shadow-emerald-100" },
  rejected:  { icon: ThumbsDown,    bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200/60",   dot: "bg-red-400",     glow: "shadow-red-100" },
  active:    { icon: Zap,           bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60",dot:"bg-emerald-400", glow: "shadow-emerald-100" },
  inactive:  { icon: CircleDot,     bg: "bg-neutral-50", text: "text-neutral-500", border: "border-neutral-200/60",dot:"bg-neutral-400", glow: "shadow-neutral-100" },
  failed:    { icon: XCircle,       bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200/60",   dot: "bg-red-400",     glow: "shadow-red-100" },
  "return picked": { icon: Truck, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/60", dot: "bg-blue-400", glow: "shadow-blue-100" },
};

const DEFAULT_CONFIG = { icon: CircleDot, bg: "bg-neutral-50", text: "text-neutral-600", border: "border-neutral-200/60", dot: "bg-neutral-400", glow: "shadow-neutral-100" };

export const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase() || "pending";
  const config = STATUS_CONFIG[key] || DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${config.bg} ${config.text} ${config.border}
        border rounded-lg
        px-2.5 py-1
        text-[10px] font-black uppercase tracking-[0.15em]
        shadow-sm ${config.glow}
        transition-all duration-300
      `}
    >
      <Icon size={12} strokeWidth={2.5} />
      {status}
    </span>
  );
};
