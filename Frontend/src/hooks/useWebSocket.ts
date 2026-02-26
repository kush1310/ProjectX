import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";

/**
 * WebSocket hook using STOMP over native WebSocket.
 * 
 * Connects to the backend /ws-native endpoint and provides
 * subscribe and publish capabilities. Auto-reconnects on disconnect.
 */
export const useWebSocket = () => {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = window.location.hostname;
    const wsPort = "8080"; // Backend port
    const brokerURL = `${wsProtocol}//${wsHost}:${wsPort}/ws-native`;

    const client = new Client({
      brokerURL,
      
      onConnect: () => {
        console.log("✅ WebSocket Connected to", brokerURL);
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("❌ WebSocket Disconnected");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
        console.error("Details:", frame.body);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
      },
      
      // Reconnect with 5s delay
      reconnectDelay: 5000,
      
      // Heartbeat: send every 10s, expect every 10s
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  /**
   * Subscribe to a STOMP topic.
   * Returns the subscription object which can be unsubscribed.
   */
  const subscribe = useCallback(
    (topic: string, callback: (message: any) => void) => {
      if (!clientRef.current || !isConnected) return null;

      return clientRef.current.subscribe(topic, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      });
    },
    [isConnected],
  );

  /**
   * Publish a message to a STOMP destination.
   */
  const publish = useCallback(
    (destination: string, body: any) => {
      if (!clientRef.current || !isConnected) {
        console.warn("Cannot publish: WebSocket not connected");
        return;
      }

      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    },
    [isConnected],
  );

  return { isConnected, subscribe, publish };
};
