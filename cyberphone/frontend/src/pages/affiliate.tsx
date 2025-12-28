import React, { useEffect, useState } from "react";
import api from "../lib/api";

export default function AffiliateDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/affiliate/sales");
        setSales(res.data.sales || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);
  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Painel de Afiliados</h1>
      <div className="bg-white border rounded p-4">
        <div className="mb-3">Vendas referidas</div>
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="p-2 border rounded">
              Venda: {s.amount} Kz — Comissão: {s.percent}%
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}