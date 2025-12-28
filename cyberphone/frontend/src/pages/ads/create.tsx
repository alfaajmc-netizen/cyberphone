import React, { useState } from "react";
import api from "../../lib/api";
import Router from "next/router";

export default function CreateAd() {
  const [title, setTitle] = useState("");
  const [pricePerDay, setPricePerDay] = useState<number>(100);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/ads", { title, pricePerDay, link });
      alert("Anúncio criado");
      Router.push("/ads");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar anúncio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Anúncio</h1>
      <form onSubmit={handleCreate} className="bg-white border rounded p-4 space-y-3">
        <div>
          <label className="text-sm">Título</label>
          <input className="w-full border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Preço por dia (Kz)</label>
          <input type="number" className="w-full border p-2 rounded" value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm">Link (opcional)</label>
          <input className="w-full border p-2 rounded" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? "A criar..." : "Criar"}</button>
        </div>
      </form>
    </main>
  );
}