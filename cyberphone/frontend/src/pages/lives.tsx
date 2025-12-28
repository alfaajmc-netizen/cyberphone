import React, { useEffect, useState } from "react";
import api from "../lib/api";
import Link from "next/link";

/**
 * Lista de lives públicas
 */
export default function LivesListPage() {
  const [lives, setLives] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/lives");
        setLives(res.data.lives || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Lives</h1>
        <Link href="/live/create"><a className="px-3 py-1 bg-indigo-600 text-white rounded">Criar Live</a></Link>
      </div>

      <div className="space-y-3">
        {lives.map((l) => (
          <div key={l.id} className="bg-white border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{l.title}</div>
              <div className="text-sm text-gray-600">Por @{l.host?.username} • {l.price} Kz</div>
            </div>
            <div>
              <Link href={`/live/${l.id}`}><a className="px-3 py-1 bg-green-600 text-white rounded">Entrar</a></Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}