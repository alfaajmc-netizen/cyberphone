import React, { useState } from "react";
import api from "../../lib/api";
import Router from "next/router";
import { useAuth } from "../../store/useAuth";

export default function CreateLivePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/lives", { title, description, price });
      const live = res.data.live;
      alert("Live criada");
      Router.push(`/live/${live.id}`);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar live: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div className="max-w-2xl mx-auto p-4">É necessário iniciar sessão para criar uma live.</div>;
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Live</h1>
      <form className="bg-white border rounded p-4 space-y-3" onSubmit={handleCreate}>
        <div>
          <label className="text-sm block">Título</label>
          <input className="mt-1 w-full border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm block">Descrição</label>
          <textarea className="mt-1 w-full border p-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-sm block">Preço (Kz) — 0 = grátis</label>
          <input type="number" className="mt-1 w-full border p-2 rounded" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? "A criar..." : "Criar Live"}</button>
        </div>
      </form>
    </main>
  );
}