"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REQUEST_HEADER } from "../../server/request-header";
import type { ClientMessage, Peer, ServerMessage } from "./types";

const RETRY_MS = [500, 1500, 4000, 10000];

export interface RealtimeSocket {
  connected: boolean;
  me: Peer | null;
  peers: Peer[];
  send: (message: ClientMessage) => void;
}

/** Lo que cada mensaje del servidor cambia en la lista de personas conectadas. */
function reduce(peers: Peer[], message: ServerMessage): Peer[] {
  switch (message.type) {
    case "hello":
      return message.peers;
    case "peer":
      return [...peers.filter((peer) => peer.id !== message.peer.id), message.peer];
    case "leave":
      return peers.filter((peer) => peer.id !== message.id);
    case "cursor":
      return peers.map((peer) => (peer.id === message.id ? { ...peer, page: message.page, cursor: message.cursor } : peer));
    case "select":
      return peers.map((peer) => (peer.id === message.id ? { ...peer, page: message.page, selection: message.ids } : peer));
    default:
      return peers;
  }
}

/**
 * La conexión al servidor de tiempo real: pide un boleto a la app, se conecta, se reconecta sola si se cae y mantiene la lista
 * de personas en vivo. `onMessage` recibe todo lo que llega (los borradores de edición los usa quien aplica los cambios).
 * `onReconnect` avisa cuando se vuelve a conectar después de una caída (pudo perderse algo).
 */
export function useRealtimeSocket(enabled: boolean, onMessage: (message: ServerMessage) => void, onReconnect: () => void): RealtimeSocket {
  const [connected, setConnected] = useState(false);
  const [me, setMe] = useState<Peer | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const socket = useRef<WebSocket | null>(null);
  const handlers = useRef({ onMessage, onReconnect });

  useEffect(() => {
    handlers.current = { onMessage, onReconnect };
  });

  useEffect(() => {
    if (!enabled) return;
    let closed = false;
    let attempt = 0;
    let everConnected = false;
    let timer: ReturnType<typeof setTimeout>;

    const open = async () => {
      try {
        const response = await fetch("/api/cms/realtime", { headers: { [REQUEST_HEADER]: "1" } });
        if (!response.ok) throw new Error("sin boleto");
        const { url, ticket } = (await response.json()) as { url: string; ticket: string };
        if (closed) return;
        const ws = new WebSocket(`${url}/?ticket=${encodeURIComponent(ticket)}`);
        socket.current = ws;
        ws.onopen = () => {
          attempt = 0;
          setConnected(true);
          if (everConnected) handlers.current.onReconnect();
          everConnected = true;
        };
        ws.onmessage = (event) => {
          const message = JSON.parse(String(event.data)) as ServerMessage;
          if (message.type === "hello") setMe(message.me);
          setPeers((current) => reduce(current, message));
          handlers.current.onMessage(message);
        };
        ws.onclose = () => {
          socket.current = null;
          setConnected(false);
          setPeers([]);
          if (!closed) timer = setTimeout(open, RETRY_MS[Math.min(attempt++, RETRY_MS.length - 1)]);
        };
      } catch {
        if (!closed) timer = setTimeout(open, RETRY_MS[Math.min(attempt++, RETRY_MS.length - 1)]);
      }
    };
    void open();

    return () => {
      closed = true;
      clearTimeout(timer);
      socket.current?.close();
    };
  }, [enabled]);

  const send = useCallback((message: ClientMessage) => {
    const ws = socket.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }, []);

  return { connected, me, peers, send };
}
