```tsx
import React, { useState, useEffect } from "react";
import api from "../lib/api";

export default function LikeButton({ postId, initialCount, initiallyLiked }: { postId: string; initialCount: number; initiallyLiked?: boolean }) {
  const [liked, setLiked] = useState(Boolean(initiallyLiked));
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setLiked(Boolean(initiallyLiked));
  }, [initiallyLiked]);

  async function toggle() {
    try {
      if (!liked) {
        await api.post(`/api/social/posts/${postId}/like`);
        setLiked(true);
        setCount((c) => c + 1);
      } else {
        await api.post(`/api/social/posts/${postId}/unlike`);
        setLiked(false);
        setCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("like error", err);
      alert("Erro ao registar like");
    }
  }

  return (
    <button onClick={toggle} className={`px-2 py-1 rounded ${liked ? "bg-red-500 text-white" : "border"}`}>
      ❤️ {count}
    </button>
  );
}
```