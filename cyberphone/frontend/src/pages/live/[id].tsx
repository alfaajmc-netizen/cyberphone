import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../../lib/api";
import { useAuth } from "../../store/useAuth";
import LiveHost from "../../components/LiveHost";
import LiveViewer from "../../components/LiveViewer";

/**
 * Página da live:
 * - mostra botão "Iniciar (host)" se usuário for host
 * - ou botão "Entrar / Comprar ingresso" se viewer
 * - para o MVP: compra de ingresso é mock (ordem criada)
 */
export default function LivePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [live, setLive] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/api/lives/${id}`);
        setLive(res.data.live);
        if (user && res.data.live?.hostId === user.id) setIsHost(true);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id, user]);

  async function handleBuy() {
    if (!id) return;
    setLoading(true);
    try {
      await api.post(`/api/lives/${id}/buy`);
      alert("Ingresso comprado com sucesso (mock)");
      setJoined(true);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao comprar ingresso: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!live) return <div className="max-w-3xl mx-auto p-4">A carregar live...</div>;

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{live.title}</h1>
      <div className="text-sm text-gray-600 mb-4">Por @{live.host?.username} · Preço: {live.price} Kz</div>
      <p className="mb-4">{live.description}</p>

      {isHost ? (
        <div>
          <div className="mb-3">
            <div className="text-sm text-gray-700">Tu és o host — inicia a transmissão abaixo.</div>
          </div>
          <LiveHost liveId={String(id)} userId={user?.id} />
        </div>
      ) : (
        <div>
          {!joined ? (
            <div className="flex items-center space-x-3 mb-4">
              <button onClick={handleBuy} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
                {loading ? "A processar..." : live.price > 0 ? `Comprar ingresso (${live.price} Kz)` : "Entrar (Grátis)"}
              </button>
              <button onClick={() => setJoined(true)} className="px-4 py-2 border rounded">Entrar sem comprar (para testes)</button>
            </div>
          ) : (
            <div>
              <LiveViewer liveId={String(id)} userId={user?.id} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}