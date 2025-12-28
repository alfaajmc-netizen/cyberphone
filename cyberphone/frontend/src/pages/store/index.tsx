import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import ProductCard from "../../components/ProductCard";
import Link from "next/link";

export default function StoreList() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/products");
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Loja CyBerPhone</h1>
        <Link href="/store/create"><a className="px-3 py-1 bg-indigo-600 text-white rounded">Criar Produto</a></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </main>
  );
}