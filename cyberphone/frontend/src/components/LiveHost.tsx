import React, { useEffect, useRef, useState } from "react";
import { createSocket } from "../lib/socket";
import api from "../lib/api";

/**
 * LiveHost
 * - host streams local media (video+audio) to viewers (existing broadcast logic)
 * - receives 'live:hand:raised' events and shows list at bottom
 * - host can Approve -> emits 'host:approve-speak' to server (server forwards to viewer)
 * - when viewer is permitted they will send an offer to the host; host handles incoming offers
 *
 * Notes:
 * - pcMapRef stores peer connections indexed by peerSocketId
 * - participants list stores remote streams to be rendered
 */

type Participant = {
  socketId: string;
  userId?: string;
  username?: string;
  stream?: MediaStream | null;
};

export default function LiveHost({ liveId, userId }: { liveId: string; userId?: string }) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<any>(null);
  const [status, setStatus] = useState("Inicializando...");
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcMapRef = useRef<Record<string, RTCPeerConnection>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [raisedHands, setRaisedHands] = useState<Participant[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token") || undefined;
    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
      setStatus("Socket ligado");
      socket.emit("live:host:join", { liveId });
    });

    // viewer joined (existing)
    socket.on("live:viewer:join", ({ userId: vUserId, socketId }: any) => {
      console.log("viewer joined", vUserId, socketId);
      // Optionally show presence in participants
      setParticipants((p) => {
        if (p.find((x) => x.socketId === socketId)) return p;
        return [...p, { socketId, userId: vUserId, username: undefined, stream: null }];
      });
    });

    // new hand raised
    socket.on("live:hand:raised", (payload: any) => {
      setRaisedHands((r) => {
        if (r.find((x) => x.socketId === payload.socketId)) return r;
        return [...r, { socketId: payload.socketId, userId: payload.userId, username: payload.username }];
      });
    });

    socket.on("live:hand:dismissed", ({ socketId }: any) => {
      setRaisedHands((r) => r.filter((h) => h.socketId !== socketId));
    });

    socket.on("live:hand:approved", ({ socketId }: any) => {
      // remove from queue (UI)
      setRaisedHands((r) => r.filter((h) => h.socketId !== socketId));
    });

    // signaling: viewer sends offer to host (for viewer->host publishing)
    socket.on("webrtc:offer", async ({ from, offer }: { from: string; offer: any }) => {
      console.log("Host received offer from", from);
      try {
        // create PC for this viewer if doesn't exist
        let pc = pcMapRef.current[from];
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
          pcMapRef.current[from] = pc;

          // when host receives a track (viewer publishing), attach it to participants state
          pc.ontrack = (ev) => {
            console.log("Host got track from", from, ev.streams);
            const stream = ev.streams && ev.streams[0];
            setParticipants((prev) => {
              const existing = prev.find((x) => x.socketId === from);
              if (existing) {
                return prev.map((x) => (x.socketId === from ? { ...x, stream } : x));
              }
              return [...prev, { socketId: from, stream }];
            });
          };

          pc.onicecandidate = (ev) => {
            if (ev.candidate) {
              socket.emit("webrtc:ice", { to: from, candidate: ev.candidate });
            }
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", { to: from, answer });
      } catch (err) {
        console.error("Error handling offer on host:", err);
      }
    });

    // ice from viewer
    socket.on("webrtc:ice", ({ from, candidate }: { from: string; candidate: any }) => {
      const pc = pcMapRef.current[from];
      if (!pc || !candidate) return;
      try {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Host addIceCandidate error", err);
      }
    });

    socket.on("disconnect", () => {
      setStatus("Socket desligado");
    });

    // start local camera for host preview and to stream if desired
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = s;
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
        setStatus("Pronto");
      } catch (err) {
        console.error("getUserMedia error", err);
        setStatus("Erro camera/mic");
      }
    })();

    return () => {
      socket.disconnect();
      Object.values(pcMapRef.current).forEach((pc) => pc.close());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function approveHand(socketId: string) {
    // host approves a viewer to publish
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("host:approve-speak", { toSocketId: socketId, liveId });
    // UI update: remove from queue (we also listen to live:hand:approved)
    setRaisedHands((r) => r.filter((h) => h.socketId !== socketId));
  }

  function dismissHand(socketId: string) {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("host:dismiss-hand", { toSocketId: socketId, liveId });
    setRaisedHands((r) => r.filter((h) => h.socketId !== socketId));
  }

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm text-gray-600">{status}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Local preview */}
        <div className="bg-black aspect-video rounded overflow-hidden">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>

        {/* remote participant tiles */}
        <div className="space-y-3">
          {participants.map((p) => (
            <div key={p.socketId} className="bg-black aspect-video rounded overflow-hidden">
              <video
                autoPlay
                playsInline
                controls={false}
                ref={(el) => {
                  if (!el) return;
                  if (p.stream && el.srcObject !== p.stream) el.srcObject = p.stream;
                }}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* raised hands list at bottom */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-4 z-50">
        <div className="bg-white border rounded p-3 shadow-lg max-w-3xl">
          <div className="font-semibold mb-2">Pedidos para falar</div>
          {raisedHands.length === 0 && <div className="text-sm text-gray-500">Nenhum pedido</div>}
          <div className="flex space-x-2 flex-wrap">
            {raisedHands.map((h) => (
              <div key={h.socketId} className="flex items-center space-x-2 border rounded px-3 py-1">
                <div className="text-sm font-medium">{h.username || `User ${h.userId}`}</div>
                <button onClick={() => approveHand(h.socketId)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">
                  Aprovar
                </button>
                <button onClick={() => dismissHand(h.socketId)} className="px-2 py-1 bg-gray-200 rounded text-sm">
                  Rejeitar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        <div>Nota: quando aprovas um pedido, o participante receberá permissão para começar a transmitir.</div>
      </div>
    </div>
  );
}