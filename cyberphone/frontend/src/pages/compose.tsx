// Página compose usa o PostComposer
import React from "react";
import PostComposer from "../components/PostComposer";

export default function ComposePage() {
  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar conteúdo</h1>
      <PostComposer />
    </main>
  );
}