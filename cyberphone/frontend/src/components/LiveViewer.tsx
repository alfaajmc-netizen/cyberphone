import React, { useEffect, useRef, useState } from "react";
import { createSocket } from "../lib/socket";

/**
 * LiveViewer:
 * - join live room
 * - raises hand (emit 'raise-hand')
 * - when receives 'permission:granted' -> create RTCPeerConnection, add local tracks (audio/video as desired),
 *   createOffer and send to host (to=hostSocketId)
 * - handles webrtc:answer and webrtc:ice
 */

export default function LiveViewer({ liveId, userId }: { liveId: string; userId?: string }) {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);
  const [status, setStatus] = useState("Inicializando...");
  const [handRaised, setHandRaised] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || undefined;
    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
      setStatus("Ligado ao socket");
      socket.emit("live:join", { liveId });
    });

    socket.on("webrtc:answer", ({ from, answer }: { from: string; answer: any }) => {
      const pc = pcRef.current;
      if (!pc) return;
      pc.setRemoteDescription(new RTCSessionDescription(answer)).catch((e) => console.error(e));
    });

    socket.on("webrtc:ice", ({ from, candidate }: { from: string; candidate: any }) => {
      const pc = pcRef.current;
      if (!pc || !candidate) return;
      try {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("viewer addIceCandidate error", err);
      }
    });

    // permission granted by host
    socket.on("permission:granted", async ({ hostSocketId }: { hostSocketId: string }) => {
      console.log("Permission granted by host", hostSocketId);
      setStatus("Autorizado a falar — a iniciar transmissão...");
      // start publishing (get mic + camera if you want)
      await startPublishing(hostSocketId);
    });

    socket.on("disconnect", () => {
      setStatus("Socket desconectado");
    });

    return () => {
      socket.disconnect();
      if (pcRef.current) pcRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function raiseHand() {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("raise-hand", { liveId });
    setHandRaised(true);
    setStatus("Mão levantada — à espera de aprovação");
  }

  async function startPublishing(hostSocketId: string) {
    try {
      setPublishing(true);
      // request microphone permission (and optionally camera)
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // create RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      // add tracks
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      // when remote tracks (e.g., from host) arrive, attach to remoteVideoRef (optional)
      pc.ontrack = (ev) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = ev.streams[0];
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          socketRef.current.emit("webrtc:ice", { to: hostSocketId, candidate: ev.candidate });
        }
      };

      // create offer and send to host
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("webrtc:offer", { to: hostSocketId, offer });
      setStatus("A transmitir (aguardando resposta do host)");
    } catch (err) {
      console.error("startPublishing error", err);
      setStatus("Erro ao iniciar transmissão");
    } finally {
      setPublishing(false);
      setHandRaised(false);
    }
  }

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm text-gray-600">{status}</div>
      </div>

      <div className="bg-black w-full max-w-3xl aspect-video rounded overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline controls className="w-full h-full object-cover" />
      </div>

      <div className="mt-3 flex items-center space-x-3">
        <button onClick={raiseHand} disabled={handRaised} className="px-3 py-1 bg-yellow-400 rounded">
          ✋ Levantar a mão
        </button>
        {publishing && <div className="text-sm text-gray-600">A iniciar a transmissão...</div>}
      </div>
    </div>
  );
}