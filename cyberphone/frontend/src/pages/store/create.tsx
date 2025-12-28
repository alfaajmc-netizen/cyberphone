import React, { useState } from "react";
import api from "../../lib/api";
import Router from "next/router";

export default function CreateProduct() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/products", { title, description, price });
      alert("Produto criado");
      Router.push("/store");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar produto</h1>
      <form onSubmit={handleCreate} className="bg-white border rounded p-4 space-y-3">
        <div>
          <label className="text-sm">Título</label>
          <input className="w-full border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Preço (Kz)</label>
          <input type="number" className="w-full border p-2 rounded" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm">Descrição</label>
          <textarea className="w-full border p-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? "A criar..." : "Criar"}</button>
        </div>
      </form>
    </main>
  );
}