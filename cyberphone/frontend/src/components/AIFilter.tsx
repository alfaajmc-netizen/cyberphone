import React, { useState } from "react";
import api from "../lib/api";

export default function AIFilter() {
  const [imageUrl, setImageUrl] = useState("");
  const [filter, setFilter] = useState("beauty");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function apply() {
    if (!imageUrl) return alert("Fornece uma URL de imagem (para MVP)");
    setLoading(true);
    try {
      const res = await api.post("/api/ai/filter", { imageUrl, filter });
      setResultUrl(res.data.media?.url);
      alert("Filtro aplicado — 50 Kz cobrado");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao aplicar filtro: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded p-4">
      <div className="mb-2 text-sm text-gray-600">Cada filtro custa 50 Kz</div>
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem" className="w-full border p-2 rounded mb-2" />
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full border p-2 rounded mb-2">
        <option value="beauty">Beleza</option>
        <option value="cartoon">Cartoon</option>
        <option value="professional">Profissional</option>
      </select>
      <div className="flex space-x-2">
        <button onClick={apply} className="px-3 py-1 bg-indigo-600 text-white rounded" disabled={loading}>{loading ? "A processar..." : "Aplicar filtro"}</button>
      </div>
      {resultUrl && (
        <div className="mt-3">
          <div className="text-sm text-gray-600">Resultado:</div>
          <img src={resultUrl} alt="filtered" className="mt-2 max-h-64" />
        </div>
      )}
    </div>
  );
}