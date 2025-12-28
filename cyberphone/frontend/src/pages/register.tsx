import React, { useState } from "react";
import { useAuth } from "../store/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ email, password, username, name });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Erro no registo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Registar — CyBerPhone</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded p-4 space-y-3">
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div>
          <label className="text-sm block">Nome (opcional)</label>
          <input
            className="mt-1 w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
        </div>

        <div>
          <label className="text-sm block">Nome de utilizador</label>
          <input
            className="mt-1 w-full border p-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            required
          />
        </div>

        <div>
          <label className="text-sm block">Email</label>
          <input
            className="mt-1 w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>

        <div>
          <label className="text-sm block">Palavra-passe</label>
          <input
            className="mt-1 w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "A processar..." : "Criar conta"}
          </button>
          <a className="text-sm text-gray-600" href="/login">Já tenho conta</a>
        </div>
      </form>
    </main>
  );
}