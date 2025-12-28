import React, { useEffect, useState } from "react";
import api from "../lib/api";

export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/social/posts/${postId}/comments`);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [postId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post(`/api/social/posts/${postId}/comments`, { content: text });
      setComments((c) => [...c, res.data.comment]);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Erro ao comentar");
    }
  }

  return (
    <div className="mt-3">
      <form onSubmit={submitComment} className="flex space-x-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Escreve um comentário..." />
        <button className="px-3 py-1 bg-indigo-600 text-white rounded">Enviar</button>
      </form>

      <div className="mt-3 space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="p-2 border rounded bg-white">
            <div className="text-sm text-gray-600">@{c.author?.username} · {new Date(c.createdAt).toLocaleString()}</div>
            <div className="mt-1">{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}