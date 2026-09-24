import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { decryptPayload } from "../utils/payloadCrypto";
import { getSession } from "../utils/authStore";

/**
 * WebSocket hook with encrypted payloads and JWT authentication.
 *
 * - Sends JWT token on STOMP CONNECT for authentication
 * - Decrypts { enc: "..." } messages using AES-256-GCM
 * - Auto-reconnects on disconnect
 */
export const useWebSocket = (url?: string) => {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const session = getSession();
    const token = session ? (session as any).token : null;

    // Dynamically calculate broker URL for WebSocket protocol (ws:// or wss://)
    let brokerURL = url;
    if (!brokerURL) {
      if (import.meta.env.VITE_WS_URL) {
        brokerURL = import.meta.env.VITE_WS_URL;
      } else {
        const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
        if (apiUrl && apiUrl.startsWith('http')) {
          const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
          brokerURL = `${wsBase}/ws/websocket`;
        } else {
          const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const wsProtocol = isHttps ? 'wss:' : 'ws:';
          const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
          brokerURL = `${wsProtocol}//${hostname}:8000/ws/websocket`;
        }
      }
    } else if (brokerURL.startsWith("http://")) {
      brokerURL = brokerURL.replace("http://", "ws://") + "/websocket";
    } else if (brokerURL.startsWith("https://")) {
      brokerURL = brokerURL.replace("https://", "wss://") + "/websocket";
    }

    const client = new Client({
      brokerURL,

      // Send JWT on CONNECT for authentication
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},

      // Keepalive heartbeats for load balancer stability
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      reconnectDelay: 3000,
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [url]);

  /**
   * Subscribe to a topic with automatic payload decryption.
   */
  const subscribe = useCallback(
    (topic: string, callback: (message: any) => void) => {
      if (!clientRef.current || !isConnected) return null;

      return clientRef.current.subscribe(topic, async (message) => {
        try {
          const body = JSON.parse(message.body);

          // Decrypt encrypted payloads
          if (body.enc && typeof body.enc === "string") {
            const decrypted = await decryptPayload(body.enc);
            callback(JSON.parse(decrypted));
          } else {
            callback(body);
          }
        } catch (e) {
          console.error("Failed to parse/decrypt websocket message", e);
        }
      });
    },
    [isConnected],
  );

  return { isConnected, subscribe };
};
