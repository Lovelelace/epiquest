import type { ConnectionStatus } from "../use-table-connection";

const STATUS_TEXT: Record<ConnectionStatus, { symbol: string; label: string; className: string }> =
  {
    connecting: {
      symbol: "…",
      label: "Connexion en cours",
      className: "border-slate-400 bg-slate-100",
    },
    connected: {
      symbol: "●",
      label: "Connecté, synchronisé en direct",
      className: "border-emerald-700 bg-emerald-50",
    },
    reconnecting: {
      symbol: "↻",
      label: "Connexion perdue, reconnexion…",
      className: "border-amber-700 bg-amber-50",
    },
    refused: { symbol: "✕", label: "Accès refusé", className: "border-rose-700 bg-rose-50" },
  };

/** État de la connexion temps réel, porté par un texte et un symbole, pas seulement une couleur. */
export function ConnectionStatusBadge({
  status,
  refusal,
}: {
  status: ConnectionStatus;
  refusal: string | null;
}) {
  const { symbol, label, className } = STATUS_TEXT[status];
  return (
    <p
      role="status"
      className={`inline-flex items-center gap-2 rounded border px-3 py-1 text-sm ${className}`}
    >
      <span aria-hidden="true">{symbol}</span>
      <span>
        {label}
        {status === "refused" && refusal !== null ? ` : ${refusal}` : null}
      </span>
    </p>
  );
}
