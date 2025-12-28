import React from "react";

export default function ProcessingBadge({ status }: { status?: string | null }) {
  if (!status || status === "done") return null;
  let color = "bg-gray-300";
  let text = "A processar";
  if (status === "pending") { color = "bg-yellow-300"; text = "Pendente"; }
  if (status === "processing") { color = "bg-orange-400"; text = "Processando"; }
  if (status === "failed") { color = "bg-red-500"; text = "Falhou"; }

  return (
    <span className={`inline-block px-2 py-1 text-xs text-black rounded ${color}`}>
      {text}
    </span>
  );
}