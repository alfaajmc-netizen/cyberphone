@@
-import axios from "axios";
-import { useEffect, useState } from "react";
-import io from "socket.io-client";
-
-const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
-
-export default function Home() {
-  const [posts, setPosts] = useState<any[]>([]);
-  const [socket, setSocket] = useState<any>(null);
-
-  useEffect(() => {
-    axios.get(`${API}/api/posts/feed`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
-      .then(res => setPosts(res.data.posts))
-      .catch(() => setPosts([]));
-
-    const s = io(API);
-    setSocket(s);
-    s.on("connect", () => console.log("connected to socket:", s.id));
-    s.on("chat:message", (msg: any) => console.log("chat:", msg));
-    return () => s.disconnect();
-  }, []);
-
-  return (
-    <main className="max-w-3xl mx-auto p-4">
-      <h1 className="text-2xl font-bold mb-4">CyBerPhone — Feed</h1>
-      <section>
-        {posts.map(p => (
-          <article key={p.id} className="border rounded p-3 mb-3">
-            <div className="text-sm text-gray-600">@{p.author.username} · {new Date(p.createdAt).toLocaleString()}</div>
-            <p className="mt-2">{p.content}</p>
-            {p.medias?.map((m:any) => m.type.startsWith("image") ? (
-              <img key={m.id} src={m.url} alt="" className="mt-2 max-h-60 object-cover" />
-            ) : (
-              <video key={m.id} src={m.url} controls className="mt-2 max-h-60" />
-            ))}
-          </article>
-        ))}
-      </section>
-    </main>
-  );
-}
+import axios from "axios";
+import { useEffect, useState } from "react";
+import { createSocket } from "../lib/socket";
+
+const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
+
+export default function Home() {
+  const [posts, setPosts] = useState<any[]>([]);
+  const [socket, setSocket] = useState<any>(null);
+
+  useEffect(() => {
+    axios
+      .get(`${API}/api/posts/feed`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
+      .then((res) => setPosts(res.data.posts))
+      .catch(() => setPosts([]));
+
+    const token = localStorage.getItem("token") || undefined;
+    const s = createSocket(token);
+    setSocket(s);
+    s.on("connect", () => console.log("connected to socket:", s.id));
+    s.on("chat:message", (msg: any) => console.log("chat:", msg));
+    return () => s.disconnect();
+  }, []);
+
+  return (
+    <main className="max-w-3xl mx-auto p-4">
+      <h1 className="text-2xl font-bold mb-4">CyBerPhone — Feed</h1>
+      <section>
+        {posts.map((p) => (
+          <article key={p.id} className="border rounded p-3 mb-3 bg-white">
+            <div className="text-sm text-gray-600">@{p.author.username} · {new Date(p.createdAt).toLocaleString()}</div>
+            <p className="mt-2">{p.content}</p>
+
+            {p.medias?.map((m: any) => {
+              // If media is a video, prefer transcodedUrl; use thumbnailUrl as poster if available.
+              if (m.type?.startsWith("video")) {
+                const videoSrc = m.transcodedUrl || m.url;
+                const poster = m.thumbnailUrl || undefined;
+                return (
+                  <video
+                    key={m.id}
+                    src={videoSrc}
+                    controls
+                    poster={poster}
+                    className="mt-2 max-h-60 w-full object-cover rounded"
+                  />
+                );
+              }
+              // for filtered images types and others show url
+              return <img key={m.id} src={m.thumbnailUrl || m.url} alt="" className="mt-2 max-h-60 w-full object-cover rounded" />;
+            })}
+          </article>
+        ))}
+      </section>
+    </main>
+  );
+}