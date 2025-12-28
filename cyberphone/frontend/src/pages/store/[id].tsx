import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await api.post(`/api/orders/product/${id}/buy`);
      alert("Compra efetuada (mock)");
    } catch (err: any) {
      console.error(err);
      alert("Erro ao comprar: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!product) return <div className="p-4">A carregar...</div>;

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <div className="text-sm text-gray-600">Por @{product.seller?.username}</div>
      <div className="mt-4">{product.description}</div>
      <div className="mt-4 text-2xl font-bold">{product.price} Kz</div>
      <div className="mt-4">
        <button onClick={handleBuy} className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>
          {loading ? "Processando..." : "Comprar"}
        </button>
      </div>
    </main>
  );
}