import React, { useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function UploadManager({ onUploaded }: { onUploaded?: (media: any) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleUpload() {
    if (!file) return alert("Escolhe um ficheiro primeiro");
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      setProgress(0);
      const res = await axios.post(`${API}/api/posts/upload`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });
      if (res.data && res.data.media) {
        onUploaded && onUploaded(res.data.media);
        alert("Upload concluído");
      }
    } catch (err: any) {
      console.error("upload error", err);
      alert("Erro no upload: " + (err?.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      setProgress(0);
      setFile(null);
    }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <label className="block text-sm font-medium text-gray-700">Escolher ficheiro</label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        className="mt-2"
      />
      {file && (
        <div className="mt-2">
          <div className="text-sm text-gray-600">Nome: {file.name} • Tamanho: {(file.size / 1024 / 1024).toFixed(2)} MB</div>
        </div>
      )}
      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {uploading ? `Enviando (${progress}%)` : "Enviar"}
        </button>
        <button onClick={() => setFile(null)} className="px-3 py-1 border rounded">
          Cancelar
        </button>
      </div>
    </div>
  );
}