import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import Link from "next/link";

export default function AdsList() {
  const [ads, setAds] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/ads");
        setAds(res.data.ads || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);
  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Anúncios</h1>
        <Link href="/ads/create"><a className="px-3 py-1 bg-indigo-600 text-white rounded">Criar</a></Link>
      </div>
      <div className="space-y-3">
        {ads.map(a => (
          <div key={a.id} className="bg-white border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm text-gray-600">{a.pricePerDay} Kz/dia</div>
            </div>
            <div>
              <a href={a.link || "#"} className="px-3 py-1 bg-green-600 text-white rounded">Ver</a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}