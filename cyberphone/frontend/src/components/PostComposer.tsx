import React, { useState, useRef, useEffect } from "react";
import api from "../lib/api";
import ProcessingBadge from "./ProcessingBadge";

type UploadedMedia = {
  id: string;
  url: string;
  type: string;
  size: number;
  previewUrl?: string;
  processingStatus?: string | null;
  thumbnailUrl?: string | null;
  transcodedUrl?: string | null;
};

export default function PostComposer() {
  const [content, setContent] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<string, number>>({});
  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Polling interval (ms)
  const POLL_INTERVAL = 3000;

  useEffect(() => {
    // find medias that are pending/processing and start polling
    const toPoll = uploaded.filter((m) => m.processingStatus && (m.processingStatus === "pending" || m.processingStatus === "processing"));
    if (toPoll.length === 0) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        // query each media status in parallel
        const results = await Promise.all(toPoll.map((m) => api.get(`/api/media/${m.id}`).then(r => r.data.media).catch(() => null)));
        if (cancelled) return;
        // merge updates
        setUploaded((prev) =>
          prev.map((p) => {
            const updated = results.find((r) => r && r.id === p.id);
            if (updated) {
              return { ...p, processingStatus: updated.processingStatus, thumbnailUrl: updated.thumbnailUrl, transcodedUrl: updated.transcodedUrl, url: updated.url };
            }
            return p;
          })
        );
      } catch (err) {
        console.error("poll error", err);
      } finally {
        if (!cancelled) setTimeout(poll, POLL_INTERVAL);
      }
    };

    const initialTimer = setTimeout(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaded]);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    await Promise.all(
      arr.map(async (file) => {
        const localKey = `${Date.now()}_${file.name}`;
        const previewUrl = URL.createObjectURL(file);

        setUploaded((prev) => [...prev, { id: localKey, url: previewUrl, type: file.type, size: file.size, previewUrl, processingStatus: "pending" }]);
        setUploadingMap((m) => ({ ...m, [localKey]: 0 }));

        const form = new FormData();
        form.append("file", file);

        try {
          const res = await api.post("/api/posts/upload", form, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (ev) => {
              if (ev.total) {
                const percent = Math.round((ev.loaded * 100) / ev.total);
                setUploadingMap((m) => ({ ...m, [localKey]: percent }));
              }
            },
          });
          const media = res.data.media as UploadedMedia;
          // replace temp entry with real media
          setUploaded((prev) => prev.map((p) => (p.id === localKey ? { ...media, previewUrl: media.url } : p)));
          setUploadingMap((m) => {
            const next = { ...m };
            delete next[localKey];
            return next;
          });
        } catch (err: any) {
          console.error("upload error", err);
          setError("Erro no upload de ficheiro: " + (err?.response?.data?.error || err.message));
          setUploadingMap((m) => {
            const next = { ...m };
            delete next[localKey];
            return next;
          });
        }
      })
    );
  }

  function handleSelectClick() {
    inputRef.current?.click();
  }

  function removeMedia(id: string) {
    setUploaded((prev) => prev.filter((p) => p.id !== id));
  }

  async function publish() {
    setError(null);
    setPublishing(true);
    try {
      if (Object.keys(uploadingMap).length > 0) {
        setError("Aguarde até terminar os uploads em curso.");
        setPublishing(false);
        return;
      }
      // Ensure any media that still have temp ids are handled (they shouldn't be)
      const mediaIds = uploaded.map((m) => m.id);
      const payload = { content, mediaIds, isShort };
      await api.post("/api/posts", payload);
      setContent("");
      setUploaded([]);
      setIsShort(false);
      alert("Post publicado com sucesso.");
    } catch (err: any) {
      console.error("publish error", err);
      setError(err?.response?.data?.error || err.message || "Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="bg-white border rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Criar publicação</h2>

      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="O que se passa? (texto, links, etc.)"
        className="w-full border p-2 rounded mb-3 min-h-[100px]"
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button onClick={handleSelectClick} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
            Adicionar ficheiro
          </button>
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input type="checkbox" checked={isShort} onChange={(e) => setIsShort(e.target.checked)} />
            <span>Vídeo curto (Short)</span>
          </label>
        </div>

        <div>
          <button onClick={publish} disabled={publishing} className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50">
            {publishing ? "A publicar..." : "Publicar"}
          </button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uploaded.map((m) => (
          <div key={m.id} className="border rounded p-2 relative bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="text-xs text-gray-600">
                {m.type} • {(m.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="flex items-center space-x-2">
                <ProcessingBadge status={m.processingStatus} />
                <button onClick={() => removeMedia(m.id)} className="text-red-500 text-sm">Remover</button>
              </div>
            </div>

            <div className="mt-2">
              {m.type.startsWith("image") ? (
                <img src={m.previewUrl || m.url} alt="" className="max-h-40 w-full object-cover rounded" />
              ) : (
                <video src={m.transcodedUrl || m.previewUrl || m.url} controls className="max-h-40 w-full object-cover rounded" poster={m.thumbnailUrl || undefined} />
              )}
            </div>

            <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
              <div> {m.id.startsWith("tmp") ? "Temporário" : ""}</div>
              <div>
                {uploadingMap[m.id] != null ? (
                  <span className="text-sm text-blue-600">A enviar {uploadingMap[m.id]}%</span>
                ) : m.processingStatus && (m.processingStatus === "pending" || m.processingStatus === "processing") ? (
                  <span className="text-sm text-yellow-600">Processando...</span>
                ) : (
                  <span className="text-sm text-green-600">Pronto</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}